import SwiftUI
import CampreservCore
import CampreservUI

/// Point of Sale view - phone-optimized layout
struct StaffPOSView: View {

    @EnvironmentObject private var appState: StaffAppState
    @State private var products: [POSProduct] = []
    @State private var categories: [POSCategory] = []
    @State private var selectedCategory: POSCategory?
    @State private var cart: [POSCartItem] = []
    @State private var isLoading = false
    @State private var showCheckout = false
    @State private var searchText = ""
    @State private var showQuickSale = false
    @State private var showCartReview = false

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                VStack(spacing: 0) {
                    // Search bar
                    searchBar

                    // Category tabs
                    categoryTabs

                    // Products grid (main content)
                    productsGrid

                    // Cart summary bar (bottom)
                    if !cart.isEmpty {
                        cartSummaryBar
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.campBackground)
            .navigationTitle("Point of Sale")
            .sheet(isPresented: $showCheckout) {
                POSCheckoutSheet(cart: cart, total: cartTotal) {
                    cart.removeAll()
                    showCheckout = false
                }
            }
            .sheet(isPresented: $showCartReview) {
                POSCartReviewSheet(cart: $cart)
            }
        }
        .task {
            await loadProducts()
        }
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 12) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.campTextHint)
                TextField("Search products...", text: $searchText)
                    .textFieldStyle(.plain)
                if !searchText.isEmpty {
                    Button(action: { searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.campTextHint)
                    }
                }
            }
            .padding(12)
            .background(Color.campSurface)
            .cornerRadius(10)

            // Quick sale button
            Button {
                showQuickSale = true
            } label: {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.campPrimary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.campSurface)
        .sheet(isPresented: $showQuickSale) {
            POSQuickSaleSheet()
        }
    }

    // MARK: - Category Tabs

    private var categoryTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                POSCategoryChip(
                    title: "All",
                    icon: "square.grid.2x2",
                    isSelected: selectedCategory == nil
                ) {
                    selectedCategory = nil
                }

                ForEach(categories, id: \.id) { category in
                    POSCategoryChip(
                        title: category.name,
                        icon: category.icon,
                        isSelected: selectedCategory?.id == category.id
                    ) {
                        selectedCategory = category
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
    }

    // MARK: - Products Grid

    private var productsGrid: some View {
        ScrollView {
            if isLoading {
                VStack {
                    Spacer()
                    ProgressView()
                    Text("Loading products...")
                        .font(.campBody)
                        .foregroundColor(.campTextSecondary)
                    Spacer()
                }
                .frame(maxWidth: .infinity, minHeight: 300)
            } else if filteredProducts.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "cube.box")
                        .font(.system(size: 48))
                        .foregroundColor(.campTextHint)
                    Text("No products found")
                        .font(.campBody)
                        .foregroundColor(.campTextSecondary)
                }
                .frame(maxWidth: .infinity, minHeight: 300)
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12)
                ], spacing: 12) {
                    ForEach(filteredProducts, id: \.id) { product in
                        POSProductCard(product: product, cartQuantity: quantityInCart(product)) {
                            addToCart(product)
                        }
                    }
                }
                .padding(16)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Cart Summary Bar

    private var cartSummaryBar: some View {
        HStack(spacing: 16) {
            // Tappable cart section
            Button {
                showCartReview = true
            } label: {
                HStack(spacing: 16) {
                    // Cart icon with count
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "cart.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.campPrimary)

                        Text("\(cartItemCount)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 18, height: 18)
                            .background(Color.campError)
                            .clipShape(Circle())
                            .offset(x: 8, y: -8)
                    }

                    // Items summary
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text("\(cartItemCount) items")
                                .font(.campLabel)
                                .foregroundColor(.campTextPrimary)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 10))
                                .foregroundColor(.campTextHint)
                        }
                        Text(cart.map { $0.product.name }.prefix(2).joined(separator: ", ") + (cart.count > 2 ? "..." : ""))
                            .font(.campCaption)
                            .foregroundColor(.campTextSecondary)
                            .lineLimit(1)
                    }
                }
            }
            .buttonStyle(.plain)

            Spacer()

            // Total and checkout
            VStack(alignment: .trailing, spacing: 2) {
                Text(formatMoney(cents: cartTotal))
                    .font(.campHeading3)
                    .foregroundColor(.campPrimary)
            }

            Button(action: { showCheckout = true }) {
                Text("Checkout")
                    .font(.campButton)
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .fixedSize()
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Color.campPrimary)
                    .cornerRadius(10)
            }
        }
        .padding(16)
        .background(Color.campSurface)
        .shadow(color: .black.opacity(0.1), radius: 8, y: -4)
    }

    // MARK: - Computed Properties

    private var filteredProducts: [POSProduct] {
        var result = products

        if let category = selectedCategory {
            result = result.filter { $0.categoryId == category.id }
        }

        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }

        return result
    }

    private var cartItemCount: Int {
        cart.reduce(0) { $0 + $1.quantity }
    }

    private var cartTotal: Int {
        cart.reduce(0) { $0 + ($1.product.priceCents * $1.quantity) }
    }

    private func quantityInCart(_ product: POSProduct) -> Int {
        cart.first(where: { $0.product.id == product.id })?.quantity ?? 0
    }

    // MARK: - Cart Operations

    private func addToCart(_ product: POSProduct) {
        if let index = cart.firstIndex(where: { $0.product.id == product.id }) {
            cart[index].quantity += 1
        } else {
            cart.append(POSCartItem(product: product, quantity: 1))
        }
    }

    private func formatMoney(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }

    // MARK: - Data Loading

    private func loadProducts() async {
        isLoading = true
        defer { isLoading = false }

        try? await Task.sleep(for: .seconds(0.5))

        // Demo categories
        categories = POSCategory.demoCategories

        // Demo products
        products = POSProduct.demoProducts
    }
}

// MARK: - Models

struct POSProduct: Identifiable {
    let id: String
    let name: String
    let priceCents: Int
    let categoryId: String
    let icon: String
    let color: Color
}

struct POSCategory: Identifiable {
    let id: String
    let name: String
    let icon: String
}

struct POSCartItem: Identifiable {
    let id = UUID()
    let product: POSProduct
    var quantity: Int
}

// MARK: - Demo Data

extension POSCategory {
    static let demoCategories: [POSCategory] = [
        POSCategory(id: "firewood", name: "Firewood", icon: "flame.fill"),
        POSCategory(id: "ice", name: "Ice", icon: "snowflake"),
        POSCategory(id: "snacks", name: "Snacks", icon: "leaf.fill"),
        POSCategory(id: "drinks", name: "Drinks", icon: "cup.and.saucer.fill"),
        POSCategory(id: "supplies", name: "Supplies", icon: "bag.fill"),
        POSCategory(id: "merch", name: "Merch", icon: "tshirt.fill")
    ]
}

extension POSProduct {
    static let demoProducts: [POSProduct] = [
        // Firewood
        POSProduct(id: "fw-bundle", name: "Firewood Bundle", priceCents: 899, categoryId: "firewood", icon: "flame.fill", color: .orange),
        POSProduct(id: "fw-half", name: "Half Cord", priceCents: 14999, categoryId: "firewood", icon: "flame.fill", color: .orange),
        POSProduct(id: "kindling", name: "Kindling", priceCents: 499, categoryId: "firewood", icon: "leaf.fill", color: .brown),
        POSProduct(id: "firestarter", name: "Fire Starter", priceCents: 599, categoryId: "firewood", icon: "sparkles", color: .red),

        // Ice
        POSProduct(id: "ice-bag", name: "Ice Bag (10lb)", priceCents: 499, categoryId: "ice", icon: "snowflake", color: .cyan),
        POSProduct(id: "ice-block", name: "Block Ice", priceCents: 699, categoryId: "ice", icon: "cube.fill", color: .blue),

        // Snacks
        POSProduct(id: "smores-kit", name: "S'mores Kit", priceCents: 899, categoryId: "snacks", icon: "star.fill", color: .brown),
        POSProduct(id: "chips", name: "Chips", priceCents: 299, categoryId: "snacks", icon: "leaf.fill", color: .yellow),
        POSProduct(id: "candy", name: "Candy Bar", priceCents: 199, categoryId: "snacks", icon: "rectangle.fill", color: .purple),
        POSProduct(id: "jerky", name: "Beef Jerky", priceCents: 799, categoryId: "snacks", icon: "flame.fill", color: .red),

        // Drinks
        POSProduct(id: "water", name: "Water Bottle", priceCents: 199, categoryId: "drinks", icon: "drop.fill", color: .blue),
        POSProduct(id: "soda", name: "Soda", priceCents: 249, categoryId: "drinks", icon: "cup.and.saucer.fill", color: .red),
        POSProduct(id: "coffee", name: "Coffee", priceCents: 349, categoryId: "drinks", icon: "cup.and.saucer.fill", color: .brown),
        POSProduct(id: "beer", name: "Local Beer", priceCents: 599, categoryId: "drinks", icon: "mug.fill", color: .yellow),

        // Supplies
        POSProduct(id: "propane", name: "Propane Tank", priceCents: 2499, categoryId: "supplies", icon: "cylinder.fill", color: .blue),
        POSProduct(id: "flashlight", name: "Flashlight", priceCents: 1299, categoryId: "supplies", icon: "flashlight.on.fill", color: .yellow),
        POSProduct(id: "bug-spray", name: "Bug Spray", priceCents: 899, categoryId: "supplies", icon: "ant.fill", color: .green),
        POSProduct(id: "sunscreen", name: "Sunscreen", priceCents: 999, categoryId: "supplies", icon: "sun.max.fill", color: .orange),

        // Merch
        POSProduct(id: "tshirt", name: "Camp T-Shirt", priceCents: 2499, categoryId: "merch", icon: "tshirt.fill", color: .green),
        POSProduct(id: "hat", name: "Camp Hat", priceCents: 1999, categoryId: "merch", icon: "crown.fill", color: .blue),
        POSProduct(id: "sticker", name: "Sticker Pack", priceCents: 599, categoryId: "merch", icon: "star.fill", color: .purple)
    ]
}

// MARK: - Components

struct POSCategoryChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                Text(title)
            }
            .font(.campLabel)
            .foregroundColor(isSelected ? .white : .campTextPrimary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(isSelected ? Color.campPrimary : Color.campBackground)
            .cornerRadius(20)
        }
    }
}

struct POSProductCard: View {
    let product: POSProduct
    let cartQuantity: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                // Icon with quantity badge
                ZStack(alignment: .topTrailing) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(product.color.opacity(0.15))
                        .frame(height: 70)
                        .overlay(
                            Image(systemName: product.icon)
                                .font(.system(size: 28))
                                .foregroundColor(product.color)
                        )

                    if cartQuantity > 0 {
                        Text("\(cartQuantity)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 22, height: 22)
                            .background(Color.campPrimary)
                            .clipShape(Circle())
                            .offset(x: 4, y: -4)
                    }
                }

                Text(product.name)
                    .font(.campCaption)
                    .foregroundColor(.campTextPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .frame(height: 32)

                Text(formatMoney(cents: product.priceCents))
                    .font(.campLabel)
                    .foregroundColor(.campPrimary)
            }
            .padding(10)
            .background(Color.campSurface)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        }
        .buttonStyle(.plain)
    }

    private func formatMoney(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

// MARK: - Checkout Sheet

struct POSCheckoutSheet: View {
    let cart: [POSCartItem]
    let total: Int
    let onComplete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selectedPaymentMethod: POSPaymentMethod = .terminal
    @State private var currentStep: CheckoutStep = .selectPayment
    @State private var isProcessing = false
    @State private var linkedReservation: String = ""

    // Cash payment
    @State private var cashTendered = ""
    @State private var showCashQuickAmounts = true

    // Charge to room
    @State private var selectedReservation: POSReservation?
    @State private var reservationSearch = ""

    // Terminal
    @State private var terminalStatus: TerminalStatus = .searching

    // Receipt
    @State private var receiptEmailSent = false
    @State private var receiptPrinted = false
    @State private var showEmailInput = false
    @State private var guestEmail = ""
    @State private var showPrintPreview = false

    enum CheckoutStep {
        case selectPayment
        case cashPayment
        case terminalPayment
        case chargeToRoom
        case success
    }

    enum TerminalStatus {
        case searching
        case connecting
        case ready
        case processing
        case error(String)
    }

    var body: some View {
        NavigationStack {
            Group {
                switch currentStep {
                case .selectPayment:
                    paymentSelectionView
                case .cashPayment:
                    cashPaymentView
                case .terminalPayment:
                    terminalPaymentView
                case .chargeToRoom:
                    chargeToRoomView
                case .success:
                    successView
                }
            }
            .background(Color.campBackground)
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .interactiveDismissDisabled(currentStep == .success) // Force button tap after payment
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if currentStep != .success {
                        Button(currentStep == .selectPayment ? "Cancel" : "Back") {
                            if currentStep == .selectPayment {
                                dismiss()
                            } else {
                                currentStep = .selectPayment
                            }
                        }
                    }
                }
            }
        }
    }

    private var navigationTitle: String {
        switch currentStep {
        case .selectPayment: return "Checkout"
        case .cashPayment: return "Cash Payment"
        case .terminalPayment: return "Card Payment"
        case .chargeToRoom: return "Charge to Room"
        case .success: return "Complete"
        }
    }

    // MARK: - Payment Selection View

    private var paymentSelectionView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Order summary
                orderSummaryCard

                // Optional guest link (collapsible)
                VStack(alignment: .leading, spacing: 12) {
                    Button {
                        withAnimation {
                            if selectedReservation != nil {
                                selectedReservation = nil
                            } else {
                                showGuestSearch = true
                            }
                        }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: selectedReservation != nil ? "person.fill.checkmark" : "person.badge.plus")
                                .foregroundColor(selectedReservation != nil ? .campSuccess : .campPrimary)
                                .frame(width: 24)

                            if let guest = selectedReservation {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(guest.guestName)
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)
                                    Text(guest.siteName)
                                        .font(.campCaption)
                                        .foregroundColor(.campTextSecondary)
                                }
                            } else {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Link to Guest")
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)
                                    Text("Optional - for tracking purchases")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextHint)
                                }
                            }

                            Spacer()

                            if selectedReservation != nil {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.campTextHint)
                            } else {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundColor(.campTextHint)
                            }
                        }
                        .padding(14)
                        .background(selectedReservation != nil ? Color.campSuccess.opacity(0.1) : Color.campSurface)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(selectedReservation != nil ? Color.campSuccess : Color.campBorder, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }

                // Payment method
                VStack(alignment: .leading, spacing: 12) {
                    Text("Payment Method")
                        .font(.campHeading3)
                        .foregroundColor(.campTextPrimary)

                    ForEach(POSPaymentMethod.allCases, id: \.self) { method in
                        POSPaymentMethodRow(
                            method: method,
                            isSelected: selectedPaymentMethod == method
                        ) {
                            selectedPaymentMethod = method
                        }
                    }
                }

                // Continue button
                PrimaryButton("Continue", icon: "arrow.right") {
                    proceedToPayment()
                }
            }
            .padding(16)
        }
        .sheet(isPresented: $showGuestSearch) {
            POSGuestSearchSheet(selectedGuest: $selectedReservation)
        }
    }

    @State private var showGuestSearch = false

    private var orderSummaryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Order Summary")
                .font(.campHeading3)
                .foregroundColor(.campTextPrimary)

            ForEach(cart, id: \.product.id) { item in
                HStack {
                    Text("\(item.quantity)x")
                        .font(.campLabel)
                        .foregroundColor(.campTextHint)
                        .frame(width: 30, alignment: .leading)
                    Text(item.product.name)
                        .font(.campBody)
                        .foregroundColor(.campTextPrimary)
                    Spacer()
                    Text(formatMoney(cents: item.product.priceCents * item.quantity))
                        .font(.campLabel)
                        .foregroundColor(.campTextPrimary)
                }
            }

            Divider()

            HStack {
                Text("Total")
                    .font(.campHeading3)
                Spacer()
                Text(formatMoney(cents: total))
                    .font(.campHeading2)
                    .foregroundColor(.campPrimary)
            }
        }
        .padding(16)
        .background(Color.campSurface)
        .cornerRadius(12)
    }

    private func proceedToPayment() {
        switch selectedPaymentMethod {
        case .cash:
            currentStep = .cashPayment
        case .terminal, .card:
            currentStep = .terminalPayment
            startTerminalConnection()
        case .chargeRoom:
            currentStep = .chargeToRoom
        }
    }

    // MARK: - Cash Payment View

    private var cashPaymentView: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 24) {
                    // Total due
                    VStack(spacing: 8) {
                        Text("Amount Due")
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)
                        Text(formatMoney(cents: total))
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.campPrimary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                    .background(Color.campSurface)
                    .cornerRadius(16)

                    // Cash tendered input
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Cash Received")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        HStack(spacing: 8) {
                            Text("$")
                                .font(.campHeading2)
                                .foregroundColor(.campTextSecondary)
                            TextField("0.00", text: $cashTendered)
                                .font(.system(size: 32, weight: .semibold))
                                .keyboardType(.decimalPad)
                                .foregroundColor(.campTextPrimary)
                        }
                        .padding(16)
                        .background(Color.campSurface)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.campPrimary, lineWidth: 2)
                        )

                        // Quick amount buttons
                        if showCashQuickAmounts {
                            VStack(spacing: 8) {
                                Text("Quick Amounts")
                                    .font(.campCaption)
                                    .foregroundColor(.campTextHint)

                                LazyVGrid(columns: [
                                    GridItem(.flexible()),
                                    GridItem(.flexible()),
                                    GridItem(.flexible())
                                ], spacing: 8) {
                                    ForEach(quickCashAmounts, id: \.self) { amount in
                                        Button {
                                            cashTendered = String(format: "%.2f", Double(amount) / 100.0)
                                        } label: {
                                            Text(formatMoney(cents: amount))
                                                .font(.campLabel)
                                                .foregroundColor(.campTextPrimary)
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 14)
                                                .background(Color.campSurface)
                                                .cornerRadius(10)
                                        }
                                    }

                                    Button {
                                        cashTendered = String(format: "%.2f", Double(total) / 100.0)
                                    } label: {
                                        Text("Exact")
                                            .font(.campLabel)
                                            .foregroundColor(.campPrimary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 14)
                                            .background(Color.campPrimary.opacity(0.1))
                                            .cornerRadius(10)
                                    }
                                }
                            }
                        }
                    }

                    // Change calculation
                    if let tenderedCents = cashTenderedCents, tenderedCents >= total {
                        VStack(spacing: 12) {
                            Divider()

                            HStack {
                                Text("Change Due")
                                    .font(.campHeading3)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                                Text(formatMoney(cents: tenderedCents - total))
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundColor(.campSuccess)
                            }
                            .padding(20)
                            .background(Color.campSuccess.opacity(0.1))
                            .cornerRadius(16)
                        }
                    } else if let tenderedCents = cashTenderedCents, tenderedCents > 0 {
                        VStack(spacing: 12) {
                            Divider()

                            HStack {
                                Text("Still Owed")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextSecondary)
                                Spacer()
                                Text(formatMoney(cents: total - tenderedCents))
                                    .font(.campHeading3)
                                    .foregroundColor(.campError)
                            }
                            .padding(16)
                            .background(Color.campError.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding(16)
            }

            // Complete button
            VStack(spacing: 0) {
                Divider()
                PrimaryButton(
                    "Complete Sale",
                    icon: "checkmark",
                    isLoading: isProcessing
                ) {
                    Task { await completeCashPayment() }
                }
                .disabled(!canCompleteCashPayment)
                .padding(16)
                .background(Color.campSurface)
            }
        }
    }

    private var quickCashAmounts: [Int] {
        // Round up to nearest $5, $10, $20
        let roundedTo5 = ((total / 500) + 1) * 500
        let roundedTo10 = ((total / 1000) + 1) * 1000
        let roundedTo20 = ((total / 2000) + 1) * 2000

        var amounts: Set<Int> = [roundedTo5, roundedTo10, roundedTo20]
        // Add common denominations
        amounts.insert(500)
        amounts.insert(1000)
        amounts.insert(2000)
        amounts.insert(5000)
        amounts.insert(10000)

        return amounts.filter { $0 >= total }.sorted().prefix(5).map { $0 }
    }

    private var cashTenderedCents: Int? {
        guard let value = Double(cashTendered), value > 0 else { return nil }
        return Int(value * 100)
    }

    private var canCompleteCashPayment: Bool {
        guard let tendered = cashTenderedCents else { return false }
        return tendered >= total
    }

    private func completeCashPayment() async {
        isProcessing = true
        try? await Task.sleep(for: .seconds(0.5))
        isProcessing = false
        currentStep = .success
    }

    // MARK: - Terminal Payment View

    private var terminalPaymentView: some View {
        VStack(spacing: 24) {
            Spacer()

            // Total
            VStack(spacing: 8) {
                Text("Total")
                    .font(.campCaption)
                    .foregroundColor(.campTextHint)
                Text(formatMoney(cents: total))
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.campPrimary)
            }

            // Terminal status
            Group {
                switch terminalStatus {
                case .searching:
                    terminalStatusView(
                        icon: "wave.3.right",
                        title: "Searching for Reader...",
                        subtitle: "Make sure your reader is on and nearby",
                        isAnimating: true
                    )
                case .connecting:
                    terminalStatusView(
                        icon: "antenna.radiowaves.left.and.right",
                        title: "Connecting...",
                        subtitle: nil,
                        isAnimating: true
                    )
                case .ready:
                    terminalStatusView(
                        icon: "iphone.radiowaves.left.and.right",
                        title: "Ready for Payment",
                        subtitle: "Tap, insert, or swipe card",
                        isAnimating: false
                    )
                case .processing:
                    terminalStatusView(
                        icon: "creditcard",
                        title: "Processing...",
                        subtitle: "Please wait",
                        isAnimating: true
                    )
                case .error(let message):
                    terminalStatusView(
                        icon: "exclamationmark.triangle",
                        title: "Connection Error",
                        subtitle: message,
                        isAnimating: false,
                        isError: true
                    )
                }
            }
            .padding(32)
            .frame(maxWidth: .infinity)
            .background(Color.campSurface)
            .cornerRadius(20)

            Spacer()

            // Actions
            VStack(spacing: 12) {
                if case .ready = terminalStatus {
                    PrimaryButton("Simulate Payment", icon: "creditcard", isLoading: isProcessing) {
                        Task { await simulateCardPayment() }
                    }
                }

                if case .error = terminalStatus {
                    PrimaryButton("Retry", icon: "arrow.clockwise") {
                        startTerminalConnection()
                    }
                }

                SecondaryButton("Use Manual Entry") {
                    // Would show manual card entry form
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
    }

    @ViewBuilder
    private func terminalStatusView(icon: String, title: String, subtitle: String?, isAnimating: Bool, isError: Bool = false) -> some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(isError ? Color.campError.opacity(0.1) : Color.campPrimary.opacity(0.1))
                    .frame(width: 100, height: 100)

                if isAnimating {
                    Circle()
                        .stroke(Color.campPrimary.opacity(0.3), lineWidth: 3)
                        .frame(width: 100, height: 100)
                        .scaleEffect(1.3)
                        .opacity(0.5)
                }

                Image(systemName: icon)
                    .font(.system(size: 40))
                    .foregroundColor(isError ? .campError : .campPrimary)
            }

            Text(title)
                .font(.campHeading3)
                .foregroundColor(.campTextPrimary)

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.campBody)
                    .foregroundColor(.campTextSecondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private func startTerminalConnection() {
        terminalStatus = .searching
        Task {
            try? await Task.sleep(for: .seconds(1.5))
            terminalStatus = .connecting
            try? await Task.sleep(for: .seconds(1))
            terminalStatus = .ready
        }
    }

    private func simulateCardPayment() async {
        terminalStatus = .processing
        isProcessing = true
        try? await Task.sleep(for: .seconds(2))
        isProcessing = false
        currentStep = .success
    }

    // MARK: - Charge to Room View

    private var chargeToRoomView: some View {
        VStack(spacing: 0) {
            // Search
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.campTextHint)
                TextField("Search guest or site...", text: $reservationSearch)
                    .textFieldStyle(.plain)
            }
            .padding(14)
            .background(Color.campSurface)
            .cornerRadius(10)
            .padding(16)

            // Reservations list
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(filteredReservations) { reservation in
                        Button {
                            selectedReservation = reservation
                        } label: {
                            HStack(spacing: 14) {
                                Circle()
                                    .fill(Color.campPrimary.opacity(0.15))
                                    .frame(width: 50, height: 50)
                                    .overlay(
                                        Text(reservation.guestInitials)
                                            .font(.campLabel)
                                            .foregroundColor(.campPrimary)
                                    )

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(reservation.guestName)
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)

                                    HStack(spacing: 8) {
                                        Text(reservation.siteName)
                                            .font(.campCaption)
                                            .foregroundColor(.campTextSecondary)

                                        Text("Balance: \(formatMoney(cents: reservation.balanceCents))")
                                            .font(.campCaption)
                                            .foregroundColor(reservation.balanceCents > 0 ? .campWarning : .campSuccess)
                                    }
                                }

                                Spacer()

                                if selectedReservation?.id == reservation.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.campPrimary)
                                        .font(.system(size: 24))
                                }
                            }
                            .padding(14)
                            .background(selectedReservation?.id == reservation.id ? Color.campPrimary.opacity(0.05) : Color.campSurface)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(selectedReservation?.id == reservation.id ? Color.campPrimary : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
            }

            // Charge button
            if let reservation = selectedReservation {
                VStack(spacing: 12) {
                    Divider()

                    VStack(spacing: 8) {
                        HStack {
                            Text("Charge \(formatMoney(cents: total)) to:")
                                .font(.campBody)
                                .foregroundColor(.campTextSecondary)
                            Spacer()
                        }

                        HStack {
                            Text(reservation.guestName)
                                .font(.campLabel)
                                .foregroundColor(.campTextPrimary)
                            Text("- \(reservation.siteName)")
                                .font(.campCaption)
                                .foregroundColor(.campTextSecondary)
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 16)

                    PrimaryButton("Charge to Room", icon: "house.fill", isLoading: isProcessing) {
                        Task { await chargeToRoom() }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
                .background(Color.campSurface)
            }
        }
    }

    private var filteredReservations: [POSReservation] {
        let reservations = POSReservation.samples
        if reservationSearch.isEmpty {
            return reservations
        }
        return reservations.filter {
            $0.guestName.localizedCaseInsensitiveContains(reservationSearch) ||
            $0.siteName.localizedCaseInsensitiveContains(reservationSearch)
        }
    }

    private func chargeToRoom() async {
        isProcessing = true
        try? await Task.sleep(for: .seconds(1))
        isProcessing = false
        currentStep = .success
    }

    // MARK: - Success View

    private var successView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Success animation
                ZStack {
                    Circle()
                        .fill(Color.campSuccess.opacity(0.15))
                        .frame(width: 120, height: 120)

                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 64))
                        .foregroundColor(.campSuccess)
                }
                .padding(.top, 32)

                Text("Payment Complete")
                    .font(.campHeading2)
                    .foregroundColor(.campTextPrimary)

                Text(formatMoney(cents: total))
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.campPrimary)

                // Payment details
                if selectedPaymentMethod == .cash, let tendered = cashTenderedCents {
                    VStack(spacing: 8) {
                        HStack {
                            Text("Cash Received")
                                .font(.campBody)
                                .foregroundColor(.campTextSecondary)
                            Spacer()
                            Text(formatMoney(cents: tendered))
                                .font(.campLabel)
                                .foregroundColor(.campTextPrimary)
                        }
                        HStack {
                            Text("Change Given")
                                .font(.campBody)
                                .foregroundColor(.campTextSecondary)
                            Spacer()
                            Text(formatMoney(cents: tendered - total))
                                .font(.campHeading3)
                                .foregroundColor(.campSuccess)
                        }
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)
                }

                if let reservation = selectedReservation {
                    VStack(spacing: 4) {
                        Text("Charged to")
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)
                        Text("\(reservation.guestName) - \(reservation.siteName)")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)
                }

                // Receipt Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Receipt")
                        .font(.campHeading3)
                        .foregroundColor(.campTextPrimary)

                    // Email receipt status
                    if receiptEmailSent {
                        HStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.campSuccess)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Email Sent")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                                Text(guestEmail)
                                    .font(.campCaption)
                                    .foregroundColor(.campTextSecondary)
                            }
                            Spacer()
                        }
                        .padding(14)
                        .background(Color.campSuccess.opacity(0.1))
                        .cornerRadius(10)
                    } else if showEmailInput {
                        VStack(spacing: 12) {
                            HStack {
                                Image(systemName: "envelope")
                                    .foregroundColor(.campTextHint)
                                TextField("guest@email.com", text: $guestEmail)
                                    .textFieldStyle(.plain)
                                    .keyboardType(.emailAddress)
                                    .textContentType(.emailAddress)
                                    .autocapitalization(.none)
                            }
                            .padding(14)
                            .background(Color.campBackground)
                            .cornerRadius(10)

                            HStack(spacing: 12) {
                                Button {
                                    showEmailInput = false
                                    guestEmail = ""
                                } label: {
                                    Text("Cancel")
                                        .font(.campLabel)
                                        .foregroundColor(.campTextSecondary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(Color.campBackground)
                                        .cornerRadius(8)
                                }

                                Button {
                                    sendEmailReceipt()
                                } label: {
                                    Text("Send")
                                        .font(.campLabel)
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(isValidEmail ? Color.campPrimary : Color.campTextHint)
                                        .cornerRadius(8)
                                }
                                .disabled(!isValidEmail)
                            }
                        }
                    } else {
                        Button {
                            showEmailInput = true
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "envelope")
                                    .foregroundColor(.campPrimary)
                                Text("Email Receipt")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundColor(.campTextHint)
                            }
                            .padding(14)
                            .background(Color.campBackground)
                            .cornerRadius(10)
                        }
                    }

                    // Print receipt
                    Button {
                        showPrintPreview = true
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: receiptPrinted ? "checkmark.circle.fill" : "printer")
                                .foregroundColor(receiptPrinted ? .campSuccess : .campPrimary)
                            Text(receiptPrinted ? "Receipt Printed" : "Print Receipt")
                                .font(.campLabel)
                                .foregroundColor(.campTextPrimary)
                            Spacer()
                            if !receiptPrinted {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundColor(.campTextHint)
                            }
                        }
                        .padding(14)
                        .background(receiptPrinted ? Color.campSuccess.opacity(0.1) : Color.campBackground)
                        .cornerRadius(10)
                    }
                    .disabled(receiptPrinted)
                    .sheet(isPresented: $showPrintPreview) {
                        ReceiptPreviewSheet(
                            cart: cart,
                            total: total,
                            paymentMethod: selectedPaymentMethod,
                            cashTendered: cashTenderedCents,
                            guest: selectedReservation,
                            onPrinted: {
                                receiptPrinted = true
                                showPrintPreview = false
                            }
                        )
                    }

                    // No receipt option
                    if !receiptEmailSent && !receiptPrinted {
                        Text("Or continue without a receipt")
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                .padding(16)
                .background(Color.campSurface)
                .cornerRadius(12)

                // Action buttons
                VStack(spacing: 12) {
                    PrimaryButton("New Sale", icon: "plus") {
                        onComplete()
                    }

                    SecondaryButton("Done") {
                        onComplete() // Also clears cart when done
                    }
                }
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
            .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.campBackground)
        .onAppear {
            // Auto-populate email if we have a linked reservation
            if let reservation = selectedReservation {
                // In real app, reservation would have guest email
                guestEmail = "\(reservation.guestName.lowercased().replacingOccurrences(of: " ", with: "."))@email.com"
                // Auto-send if we have email
                Task {
                    try? await Task.sleep(for: .seconds(1))
                    if !guestEmail.isEmpty {
                        sendEmailReceipt()
                    }
                }
            }
        }
    }

    private var isValidEmail: Bool {
        let emailRegex = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        return guestEmail.range(of: emailRegex, options: .regularExpression) != nil
    }

    private func sendEmailReceipt() {
        guard isValidEmail else { return }
        // In real app, would call API to send receipt
        withAnimation {
            receiptEmailSent = true
            showEmailInput = false
        }
    }

    private func formatMoney(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

// MARK: - POS Reservation for Charge to Room

struct POSReservation: Identifiable {
    let id: String
    let guestName: String
    let siteName: String
    let balanceCents: Int

    var guestInitials: String {
        let parts = guestName.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))"
        }
        return String(guestName.prefix(2))
    }

    static let samples: [POSReservation] = [
        POSReservation(id: "1", guestName: "John Smith", siteName: "Site A-12", balanceCents: 15000),
        POSReservation(id: "2", guestName: "Sarah Johnson", siteName: "RV-05", balanceCents: 0),
        POSReservation(id: "3", guestName: "Mike Williams", siteName: "Cabin 3", balanceCents: 8500),
        POSReservation(id: "4", guestName: "Emily Davis", siteName: "Site B-08", balanceCents: 22000),
        POSReservation(id: "5", guestName: "Robert Brown", siteName: "RV-12", balanceCents: 0),
        POSReservation(id: "6", guestName: "Lisa Anderson", siteName: "Tent 7", balanceCents: 4500)
    ]
}

enum POSPaymentMethod: CaseIterable {
    case terminal
    case card
    case cash
    case chargeRoom

    var title: String {
        switch self {
        case .terminal: return "Tap to Pay / Reader"
        case .card: return "Manual Card Entry"
        case .cash: return "Cash"
        case .chargeRoom: return "Charge to Room"
        }
    }

    var icon: String {
        switch self {
        case .terminal: return "wave.3.right"
        case .card: return "creditcard"
        case .cash: return "dollarsign.circle"
        case .chargeRoom: return "house.fill"
        }
    }

    var description: String {
        switch self {
        case .terminal: return "Use iPhone or external reader"
        case .card: return "Enter card details manually"
        case .cash: return "Record cash payment"
        case .chargeRoom: return "Add to guest's reservation balance"
        }
    }

    var buttonLabel: String {
        switch self {
        case .terminal: return "Present Reader"
        case .card: return "Enter Card"
        case .cash: return "Record Cash"
        case .chargeRoom: return "Charge to Room"
        }
    }
}

struct POSPaymentMethodRow: View {
    let method: POSPaymentMethod
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: method.icon)
                    .font(.system(size: 22))
                    .foregroundColor(isSelected ? .campPrimary : .campTextSecondary)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(method.title)
                        .font(.campLabel)
                        .foregroundColor(.campTextPrimary)
                    Text(method.description)
                        .font(.campCaption)
                        .foregroundColor(.campTextSecondary)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .campPrimary : .campBorder)
            }
            .padding(14)
            .background(isSelected ? Color.campPrimary.opacity(0.05) : Color.campSurface)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.campPrimary : Color.campBorder, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Cart Review Sheet

struct POSCartReviewSheet: View {
    @Binding var cart: [POSCartItem]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if cart.isEmpty {
                    emptyCartView
                } else {
                    cartItemsList
                    cartSummaryFooter
                }
            }
            .background(Color.campBackground)
            .navigationTitle("Your Cart")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                if !cart.isEmpty {
                    ToolbarItem(placement: .destructiveAction) {
                        Button("Clear All") {
                            cart.removeAll()
                        }
                        .foregroundColor(.campError)
                    }
                }
            }
        }
    }

    private var emptyCartView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "cart")
                .font(.system(size: 64))
                .foregroundColor(.campTextHint)
            Text("Your cart is empty")
                .font(.campHeading3)
                .foregroundColor(.campTextPrimary)
            Text("Add items from the product grid")
                .font(.campBody)
                .foregroundColor(.campTextSecondary)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var cartItemsList: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(cart) { item in
                    VStack(spacing: 0) {
                        POSCartItemRow(
                            item: item,
                            onIncrement: { incrementItem(productId: item.product.id) },
                            onDecrement: { decrementItem(productId: item.product.id) },
                            onRemove: { removeItem(productId: item.product.id) }
                        )
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)

                        Divider()
                            .padding(.leading, 84)
                    }
                }
            }
        }
    }

    private func incrementItem(productId: String) {
        if let index = cart.firstIndex(where: { $0.product.id == productId }) {
            cart[index].quantity += 1
        }
    }

    private func decrementItem(productId: String) {
        if let index = cart.firstIndex(where: { $0.product.id == productId }) {
            if cart[index].quantity > 1 {
                cart[index].quantity -= 1
            } else {
                cart.remove(at: index)
            }
        }
    }

    private func removeItem(productId: String) {
        cart.removeAll { $0.product.id == productId }
    }

    private var cartSummaryFooter: some View {
        VStack(spacing: 12) {
            Divider()

            HStack {
                Text("\(cart.reduce(0) { $0 + $1.quantity }) items")
                    .font(.campBody)
                    .foregroundColor(.campTextSecondary)
                Spacer()
                Text("Total:")
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)
                Text(formatMoney(cents: cart.reduce(0) { $0 + ($1.product.priceCents * $1.quantity) }))
                    .font(.campHeading2)
                    .foregroundColor(.campPrimary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(Color.campSurface)
    }

    private func formatMoney(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

struct POSCartItemRow: View {
    let item: POSCartItem
    let onIncrement: () -> Void
    let onDecrement: () -> Void
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Product image placeholder
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.campPrimary.opacity(0.1))
                .frame(width: 56, height: 56)
                .overlay(
                    Image(systemName: "cube.box.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.campPrimary.opacity(0.5))
                )

            // Product info
            VStack(alignment: .leading, spacing: 4) {
                Text(item.product.name)
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)

                Text(formatMoney(cents: item.product.priceCents))
                    .font(.campCaption)
                    .foregroundColor(.campTextSecondary)
            }

            Spacer()

            // Quantity stepper
            HStack(spacing: 0) {
                Button {
                    onDecrement()
                } label: {
                    Image(systemName: item.quantity == 1 ? "trash" : "minus")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(item.quantity == 1 ? .campError : .campPrimary)
                        .frame(width: 40, height: 40)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                Text("\(item.quantity)")
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)
                    .frame(width: 32)

                Button {
                    onIncrement()
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.campPrimary)
                        .frame(width: 40, height: 40)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .background(Color.campBackground)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.campBorder, lineWidth: 1)
            )

            // Line total
            Text(formatMoney(cents: item.product.priceCents * item.quantity))
                .font(.campLabel)
                .foregroundColor(.campPrimary)
                .frame(width: 70, alignment: .trailing)
        }
        .padding(.vertical, 8)
    }

    private func formatMoney(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

// MARK: - Quick Sale Sheet

struct POSQuickSaleSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var amount = ""
    @State private var description = ""
    @State private var selectedCategory = "General"
    @State private var linkToReservation = ""
    @State private var isProcessing = false
    @State private var showSuccess = false

    let categories = ["General", "Firewood", "Ice", "Store", "Services", "Other"]

    var body: some View {
        NavigationStack {
            if showSuccess {
                successView
            } else {
                saleForm
            }
        }
    }

    private var saleForm: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Amount entry
                VStack(spacing: 8) {
                    Text("Amount")
                        .font(.campCaption)
                        .foregroundColor(.campTextHint)

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("$")
                            .font(.system(size: 40, weight: .light))
                            .foregroundColor(.campTextSecondary)

                        TextField("0.00", text: $amount)
                            .font(.system(size: 56, weight: .semibold))
                            .foregroundColor(.campTextPrimary)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: 200)
                    }
                }
                .padding(32)
                .frame(maxWidth: .infinity)
                .background(Color.campSurface)
                .cornerRadius(20)

                // Description
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.campLabel)
                            .foregroundColor(.campTextSecondary)

                        TextField("What's this for?", text: $description)
                            .font(.campBody)
                            .padding(14)
                            .background(Color.campBackground)
                            .cornerRadius(10)
                    }

                    // Category
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Category")
                            .font(.campLabel)
                            .foregroundColor(.campTextSecondary)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(categories, id: \.self) { category in
                                    Button {
                                        selectedCategory = category
                                    } label: {
                                        Text(category)
                                            .font(.campCaption)
                                            .foregroundColor(selectedCategory == category ? .white : .campTextPrimary)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(selectedCategory == category ? Color.campPrimary : Color.campBackground)
                                            .cornerRadius(20)
                                    }
                                }
                            }
                        }
                    }

                    // Link to reservation (optional)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Link to Reservation (Optional)")
                            .font(.campLabel)
                            .foregroundColor(.campTextSecondary)

                        TextField("Confirmation # or guest name", text: $linkToReservation)
                            .font(.campBody)
                            .padding(14)
                            .background(Color.campBackground)
                            .cornerRadius(10)
                    }
                }
                .padding(20)
                .background(Color.campSurface)
                .cornerRadius(16)

                // Charge button
                PrimaryButton("Charge \(formattedAmount)", icon: "creditcard", isLoading: isProcessing) {
                    Task { await processSale() }
                }
                .disabled(amount.isEmpty || Double(amount) == nil || Double(amount)! <= 0)
            }
            .padding(16)
        }
        .background(Color.campBackground)
        .navigationTitle("Quick Sale")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { dismiss() }
            }
        }
    }

    private var successView: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.campSuccess)

            Text("Sale Complete")
                .font(.campDisplaySmall)
                .foregroundColor(.campTextPrimary)

            Text(formattedAmount)
                .font(.campHeading2)
                .foregroundColor(.campPrimary)

            Spacer()

            VStack(spacing: 12) {
                PrimaryButton("New Sale", icon: "plus") {
                    amount = ""
                    description = ""
                    linkToReservation = ""
                    showSuccess = false
                }

                SecondaryButton("Done") {
                    dismiss()
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.campBackground)
    }

    private var formattedAmount: String {
        guard let value = Double(amount), value > 0 else { return "$0.00" }
        return String(format: "$%.2f", value)
    }

    private func processSale() async {
        isProcessing = true
        try? await Task.sleep(for: .seconds(1.5))
        isProcessing = false
        showSuccess = true
    }
}

// MARK: - Receipt Preview Sheet

struct ReceiptPreviewSheet: View {
    let cart: [POSCartItem]
    let total: Int
    let paymentMethod: POSPaymentMethod
    let cashTendered: Int?
    let guest: POSReservation?
    let onPrinted: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var isPrinting = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Receipt preview
                ScrollView {
                    receiptView
                        .padding(20)
                }

                // Print button
                VStack(spacing: 12) {
                    Divider()

                    PrimaryButton("Print", icon: "printer.fill", isLoading: isPrinting) {
                        printReceipt()
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
                .background(Color.campSurface)
            }
            .background(Color.campBackground)
            .navigationTitle("Receipt Preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private var receiptView: some View {
        VStack(spacing: 0) {
            // Receipt paper look
            VStack(spacing: 16) {
                // Header
                VStack(spacing: 8) {
                    Text("Pines Campground")
                        .font(.system(size: 18, weight: .bold))
                    Text("& RV Resort")
                        .font(.system(size: 14))
                    Text("123 Pine Valley Road")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    Text("Lake Tahoe, CA 96150")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                    Text("(530) 555-0123")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
                .padding(.bottom, 8)

                // Divider
                dashedLine

                // Date/Time and Receipt #
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(formatDate(Date()))
                            .font(.system(size: 11, design: .monospaced))
                        Text(formatTime(Date()))
                            .font(.system(size: 11, design: .monospaced))
                    }
                    Spacer()
                    Text("Receipt #\(String(format: "%06d", Int.random(in: 1000...999999)))")
                        .font(.system(size: 11, design: .monospaced))
                }

                dashedLine

                // Items
                VStack(spacing: 6) {
                    ForEach(cart, id: \.product.id) { item in
                        HStack(alignment: .top) {
                            Text("\(item.quantity)x")
                                .font(.system(size: 12, design: .monospaced))
                                .frame(width: 30, alignment: .leading)
                            Text(item.product.name)
                                .font(.system(size: 12, design: .monospaced))
                            Spacer()
                            Text(formatMoney(cents: item.product.priceCents * item.quantity))
                                .font(.system(size: 12, design: .monospaced))
                        }
                    }
                }

                dashedLine

                // Totals
                VStack(spacing: 4) {
                    HStack {
                        Text("Subtotal")
                            .font(.system(size: 12, design: .monospaced))
                        Spacer()
                        Text(formatMoney(cents: total))
                            .font(.system(size: 12, design: .monospaced))
                    }
                    HStack {
                        Text("Tax")
                            .font(.system(size: 12, design: .monospaced))
                        Spacer()
                        Text("$0.00")
                            .font(.system(size: 12, design: .monospaced))
                    }
                    HStack {
                        Text("TOTAL")
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                        Spacer()
                        Text(formatMoney(cents: total))
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                    }
                    .padding(.top, 4)
                }

                dashedLine

                // Payment info
                VStack(spacing: 4) {
                    HStack {
                        Text("Payment:")
                            .font(.system(size: 12, design: .monospaced))
                        Spacer()
                        Text(paymentMethod.title)
                            .font(.system(size: 12, design: .monospaced))
                    }

                    if paymentMethod == .cash, let tendered = cashTendered {
                        HStack {
                            Text("Cash Tendered:")
                                .font(.system(size: 12, design: .monospaced))
                            Spacer()
                            Text(formatMoney(cents: tendered))
                                .font(.system(size: 12, design: .monospaced))
                        }
                        HStack {
                            Text("Change:")
                                .font(.system(size: 12, design: .monospaced))
                            Spacer()
                            Text(formatMoney(cents: tendered - total))
                                .font(.system(size: 12, design: .monospaced))
                        }
                    }

                    if let guest = guest {
                        HStack {
                            Text("Guest:")
                                .font(.system(size: 12, design: .monospaced))
                            Spacer()
                            Text(guest.guestName)
                                .font(.system(size: 12, design: .monospaced))
                        }
                        HStack {
                            Text("Site:")
                                .font(.system(size: 12, design: .monospaced))
                            Spacer()
                            Text(guest.siteName)
                                .font(.system(size: 12, design: .monospaced))
                        }
                    }
                }

                dashedLine

                // Footer
                VStack(spacing: 8) {
                    Text("Thank you for your purchase!")
                        .font(.system(size: 12))
                        .fontWeight(.medium)
                    Text("Have a great stay!")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                }
                .padding(.top, 8)
            }
            .padding(20)
            .background(Color.white)
            .cornerRadius(4)
            .shadow(color: .black.opacity(0.15), radius: 8, y: 4)
        }
        .foregroundColor(.black)
    }

    private var dashedLine: some View {
        Text(String(repeating: "-", count: 40))
            .font(.system(size: 10, design: .monospaced))
            .foregroundColor(.gray)
    }

    private func formatMoney(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MM/dd/yyyy"
        return formatter.string(from: date)
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }

    private func printReceipt() {
        isPrinting = true

        // Generate receipt HTML for printing
        let receiptHTML = generateReceiptHTML()

        // Use iOS print system
        let printController = UIPrintInteractionController.shared
        printController.printInfo = UIPrintInfo(dictionary: nil)
        printController.printInfo?.jobName = "Receipt"
        printController.printInfo?.outputType = .general

        // Create a formatter for the HTML
        let formatter = UIMarkupTextPrintFormatter(markupText: receiptHTML)
        formatter.perPageContentInsets = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        printController.printFormatter = formatter

        printController.present(animated: true) { _, completed, error in
            isPrinting = false
            if completed {
                onPrinted()
            } else if let error = error {
                print("Print error: \(error.localizedDescription)")
            }
        }
    }

    private func generateReceiptHTML() -> String {
        var itemsHTML = ""
        for item in cart {
            let lineTotal = formatMoney(cents: item.product.priceCents * item.quantity)
            itemsHTML += """
            <tr>
                <td>\(item.quantity)x \(item.product.name)</td>
                <td style="text-align: right;">\(lineTotal)</td>
            </tr>
            """
        }

        var paymentHTML = "<p>Payment: \(paymentMethod.title)</p>"
        if paymentMethod == .cash, let tendered = cashTendered {
            paymentHTML += """
            <p>Cash Tendered: \(formatMoney(cents: tendered))</p>
            <p>Change: \(formatMoney(cents: tendered - total))</p>
            """
        }

        var guestHTML = ""
        if let guest = guest {
            guestHTML = """
            <p>Guest: \(guest.guestName)</p>
            <p>Site: \(guest.siteName)</p>
            """
        }

        return """
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; }
                h1 { font-size: 16px; text-align: center; margin: 0; }
                h2 { font-size: 14px; text-align: center; margin: 0; }
                .center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; }
                .total { font-weight: bold; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>Pines Campground</h1>
            <h2>& RV Resort</h2>
            <p class="center">123 Pine Valley Road<br>Lake Tahoe, CA 96150<br>(530) 555-0123</p>
            <div class="divider"></div>
            <p>\(formatDate(Date())) \(formatTime(Date()))</p>
            <div class="divider"></div>
            <table>
                \(itemsHTML)
            </table>
            <div class="divider"></div>
            <table>
                <tr><td>Subtotal</td><td style="text-align: right;">\(formatMoney(cents: total))</td></tr>
                <tr><td>Tax</td><td style="text-align: right;">$0.00</td></tr>
                <tr class="total"><td>TOTAL</td><td style="text-align: right;">\(formatMoney(cents: total))</td></tr>
            </table>
            <div class="divider"></div>
            \(paymentHTML)
            \(guestHTML)
            <div class="divider"></div>
            <p class="center"><strong>Thank you for your purchase!</strong><br>Have a great stay!</p>
        </body>
        </html>
        """
    }
}

// MARK: - Guest Search Sheet for POS

struct POSGuestSearchSheet: View {
    @Binding var selectedGuest: POSReservation?
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    private var filteredGuests: [POSReservation] {
        if searchText.isEmpty {
            return POSReservation.samples
        }
        return POSReservation.samples.filter {
            $0.guestName.localizedCaseInsensitiveContains(searchText) ||
            $0.siteName.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.campTextHint)
                    TextField("Search by name or site...", text: $searchText)
                        .textFieldStyle(.plain)
                    if !searchText.isEmpty {
                        Button {
                            searchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.campTextHint)
                        }
                    }
                }
                .padding(14)
                .background(Color.campSurface)
                .cornerRadius(10)
                .padding(16)

                // Guest list
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(filteredGuests) { guest in
                            Button {
                                selectedGuest = guest
                                dismiss()
                            } label: {
                                HStack(spacing: 14) {
                                    Circle()
                                        .fill(Color.campPrimary.opacity(0.15))
                                        .frame(width: 50, height: 50)
                                        .overlay(
                                            Text(guest.guestInitials)
                                                .font(.campLabel)
                                                .foregroundColor(.campPrimary)
                                        )

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(guest.guestName)
                                            .font(.campLabel)
                                            .foregroundColor(.campTextPrimary)

                                        Text(guest.siteName)
                                            .font(.campCaption)
                                            .foregroundColor(.campTextSecondary)
                                    }

                                    Spacer()

                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(.campTextHint)
                                }
                                .padding(14)
                                .background(Color.campSurface)
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)
                        }

                        if filteredGuests.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "person.slash")
                                    .font(.system(size: 40))
                                    .foregroundColor(.campTextHint)
                                Text("No guests found")
                                    .font(.campBody)
                                    .foregroundColor(.campTextSecondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            .background(Color.campBackground)
            .navigationTitle("Link to Guest")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
