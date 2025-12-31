import SwiftUI
import CampreservCore
import CampreservUI

/// Staff dashboard with today's overview
struct StaffDashboardView: View {

    @EnvironmentObject private var appState: StaffAppState
    @State private var summary: DashboardSummary?
    @State private var isLoading = true
    @State private var showNewBooking = false
    @State private var showGuestSearch = false
    @State private var showQuickSale = false
    @State private var showAllArrivals = false
    @State private var showAllDepartures = false
    @State private var showCampgroundSelector = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Today's stats grid
                    statsGrid

                    // Arrivals section
                    arrivalsSection

                    // Departures section
                    departuresSection

                    // Quick actions
                    quickActionsSection
                }
                .padding(16)
            }
            .background(Color.campBackground)
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCampgroundSelector = true
                    } label: {
                        Image(systemName: "building.2")
                    }
                }
            }
            .sheet(isPresented: $showCampgroundSelector) {
                CampgroundSelectorSheet()
            }
            .sheet(isPresented: $showAllArrivals) {
                AllArrivalsSheet(arrivals: summary?.upcomingArrivals ?? [])
            }
            .sheet(isPresented: $showAllDepartures) {
                AllDeparturesSheet(departures: summary?.pendingDepartures ?? [])
            }
            .refreshable {
                await loadDashboard()
            }
        }
        .task {
            await loadDashboard()
        }
    }

    // MARK: - Views

    private var statsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            StatCard(
                title: "Arrivals Today",
                value: "\(summary?.arrivalsToday ?? 0)",
                icon: "arrow.down.circle",
                color: .campSuccess
            )

            StatCard(
                title: "Departures Today",
                value: "\(summary?.departuresToday ?? 0)",
                icon: "arrow.up.circle",
                color: .campWarning
            )

            StatCard(
                title: "Occupancy",
                value: "\(summary?.occupancyPercent ?? 0)%",
                icon: "chart.pie",
                color: .campPrimary
            )

            StatCard(
                title: "Available Sites",
                value: "\(summary?.availableSites ?? 0)",
                icon: "checkmark.circle",
                color: .campInfo
            )
        }
    }

    private var arrivalsSection: some View {
        SectionCard(
            title: "Today's Arrivals",
            subtitle: "\(summary?.arrivalsToday ?? 0) guests",
            action: { showAllArrivals = true },
            actionLabel: "View All"
        ) {
            if isLoading {
                SkeletonView().frame(height: 60)
            } else if let arrivals = summary?.upcomingArrivals, !arrivals.isEmpty {
                ForEach(arrivals.prefix(3), id: \.id) { reservation in
                    ArrivalRow(reservation: reservation)
                }
            } else {
                Text("No arrivals today")
                    .font(.campBody)
                    .foregroundColor(.campTextSecondary)
            }
        }
    }

    private var departuresSection: some View {
        SectionCard(
            title: "Today's Departures",
            subtitle: "\(summary?.departuresToday ?? 0) guests",
            action: { showAllDepartures = true },
            actionLabel: "View All"
        ) {
            if isLoading {
                SkeletonView().frame(height: 60)
            } else if let departures = summary?.pendingDepartures, !departures.isEmpty {
                ForEach(departures.prefix(3), id: \.id) { reservation in
                    DepartureRow(reservation: reservation)
                }
            } else {
                Text("No departures today")
                    .font(.campBody)
                    .foregroundColor(.campTextSecondary)
            }
        }
    }

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.campHeading3)
                .foregroundColor(.campTextPrimary)

            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "plus.circle",
                    title: "New",
                    subtitle: "Booking"
                ) {
                    showNewBooking = true
                }

                QuickActionButton(
                    icon: "magnifyingglass",
                    title: "Search",
                    subtitle: "Guest"
                ) {
                    showGuestSearch = true
                }

                QuickActionButton(
                    icon: "creditcard",
                    title: "Quick",
                    subtitle: "Sale"
                ) {
                    showQuickSale = true
                }
            }
        }
        .sheet(isPresented: $showNewBooking) {
            NewBookingSheet()
        }
        .sheet(isPresented: $showGuestSearch) {
            GuestSearchSheet()
        }
        .sheet(isPresented: $showQuickSale) {
            QuickSaleSheet()
        }
    }

    // MARK: - Data Loading

    private func loadDashboard() async {
        isLoading = true
        defer { isLoading = false }

        // Call API to load dashboard summary
        // summary = try await apiClient.request(.getDashboardSummary(campgroundId: campgroundId))

        // Simulate with empty data
        try? await Task.sleep(for: .seconds(1))
        summary = DashboardSummary(
            arrivalsToday: 5,
            departuresToday: 3,
            occupancyPercent: 72,
            availableSites: 28,
            upcomingArrivals: [],
            pendingDepartures: []
        )
    }
}

// MARK: - Dashboard Models

struct DashboardSummary {
    let arrivalsToday: Int
    let departuresToday: Int
    let occupancyPercent: Int
    let availableSites: Int
    let upcomingArrivals: [Reservation]
    let pendingDepartures: [Reservation]
}

// MARK: - Components

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.campDisplayMedium)
                .foregroundColor(.campTextPrimary)

            Text(title)
                .font(.campCaption)
                .foregroundColor(.campTextSecondary)
        }
        .padding(16)
        .background(Color.campSurface)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}

struct ArrivalRow: View {
    let reservation: Reservation

    var body: some View {
        HStack {
            Circle()
                .fill(Color.campSuccess.opacity(0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: "arrow.down.circle")
                        .foregroundColor(.campSuccess)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(reservation.guestName ?? "Guest")
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)

                Text(reservation.siteName ?? "Site")
                    .font(.campCaption)
                    .foregroundColor(.campTextSecondary)
            }

            Spacer()

            Button("Check In") {
                // Perform check-in
            }
            .font(.campLabel)
            .foregroundColor(.campPrimary)
        }
        .padding(.vertical, 8)
    }
}

struct DepartureRow: View {
    let reservation: Reservation

    var body: some View {
        HStack {
            Circle()
                .fill(Color.campWarning.opacity(0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: "arrow.up.circle")
                        .foregroundColor(.campWarning)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(reservation.guestName ?? "Guest")
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)

                Text(reservation.siteName ?? "Site")
                    .font(.campCaption)
                    .foregroundColor(.campTextSecondary)
            }

            Spacer()

            StatusBadge(rawValue: reservation.status, size: .small)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - New Booking Sheet

struct NewBookingSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var guestName = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var selectedSite = ""
    @State private var arrivalDate = Date()
    @State private var departureDate = Date().addingTimeInterval(86400 * 2)
    @State private var adults = 2
    @State private var children = 0
    @State private var notes = ""
    @State private var isCreating = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Guest information
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Guest Information")
                            .font(.campHeading3)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 12) {
                            FormTextField(label: "Guest Name", text: $guestName, placeholder: "John Smith")
                            FormTextField(label: "Phone", text: $phone, placeholder: "(555) 123-4567", keyboardType: .phonePad)
                            FormTextField(label: "Email", text: $email, placeholder: "john@example.com", keyboardType: .emailAddress)
                        }
                    }
                    .padding(20)
                    .background(Color.campSurface)
                    .cornerRadius(16)

                    // Reservation details
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Reservation Details")
                            .font(.campHeading3)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 16) {
                            // Site selection
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Site")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextSecondary)

                                Menu {
                                    ForEach(["A-01", "A-02", "A-03", "B-01", "B-02", "C-01"], id: \.self) { site in
                                        Button(site) { selectedSite = site }
                                    }
                                } label: {
                                    HStack {
                                        Text(selectedSite.isEmpty ? "Select a site" : selectedSite)
                                            .foregroundColor(selectedSite.isEmpty ? .campTextHint : .campTextPrimary)
                                        Spacer()
                                        Image(systemName: "chevron.down")
                                            .foregroundColor(.campTextHint)
                                    }
                                    .font(.campBody)
                                    .padding(14)
                                    .background(Color.campBackground)
                                    .cornerRadius(10)
                                }
                            }

                            HStack(spacing: 16) {
                                DatePickerField(label: "Arrival", date: $arrivalDate)
                                DatePickerField(label: "Departure", date: $departureDate)
                            }

                            HStack(spacing: 16) {
                                StepperField(label: "Adults", value: $adults, range: 1...10)
                                StepperField(label: "Children", value: $children, range: 0...10)
                            }
                        }
                    }
                    .padding(20)
                    .background(Color.campSurface)
                    .cornerRadius(16)

                    // Notes
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes (Optional)")
                            .font(.campLabel)
                            .foregroundColor(.campTextSecondary)

                        TextEditor(text: $notes)
                            .font(.campBody)
                            .frame(height: 80)
                            .padding(10)
                            .background(Color.campBackground)
                            .cornerRadius(10)
                    }
                    .padding(20)
                    .background(Color.campSurface)
                    .cornerRadius(16)

                    // Create button
                    PrimaryButton("Create Reservation", icon: "checkmark.circle", isLoading: isCreating) {
                        Task { await createBooking() }
                    }
                    .disabled(guestName.isEmpty || selectedSite.isEmpty)
                }
                .padding(16)
            }
            .background(Color.campBackground)
            .navigationTitle("New Booking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func createBooking() async {
        isCreating = true
        try? await Task.sleep(for: .seconds(1))
        isCreating = false
        dismiss()
    }
}

// MARK: - Guest Search Sheet

struct GuestSearchSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var searchResults: [GuestSearchResult] = []
    @State private var isSearching = false
    @State private var selectedGuest: GuestSearchResult?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.campTextHint)

                    TextField("Search by name, phone, email, or confirmation #", text: $searchText)
                        .textFieldStyle(.plain)
                        .autocorrectionDisabled()

                    if !searchText.isEmpty {
                        Button {
                            searchText = ""
                            searchResults = []
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.campTextHint)
                        }
                    }
                }
                .padding(14)
                .background(Color.campBackground)
                .cornerRadius(12)
                .padding(16)

                Divider()

                // Results
                if isSearching {
                    VStack {
                        Spacer()
                        ProgressView()
                        Text("Searching...")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                        Spacer()
                    }
                } else if searchResults.isEmpty && !searchText.isEmpty {
                    VStack(spacing: 16) {
                        Spacer()
                        Image(systemName: "person.crop.circle.badge.questionmark")
                            .font(.system(size: 48))
                            .foregroundColor(.campTextHint)
                        Text("No guests found")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                        Text("Try searching with different criteria")
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)
                        Spacer()
                    }
                } else if searchResults.isEmpty {
                    VStack(spacing: 16) {
                        Spacer()
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 48))
                            .foregroundColor(.campTextHint)
                        Text("Search for a guest")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                        Text("Enter name, phone, email, or confirmation #")
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)
                        Spacer()
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(searchResults) { guest in
                                GuestSearchRow(guest: guest) {
                                    selectedGuest = guest
                                }

                                if guest.id != searchResults.last?.id {
                                    Divider()
                                        .padding(.leading, 60)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.campSurface)
            .navigationTitle("Search Guests")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .onChange(of: searchText) { _ in
                performSearch()
            }
            .sheet(item: $selectedGuest) { guest in
                GuestDetailSheet(guest: guest)
            }
        }
    }

    private func performSearch() {
        guard searchText.count >= 2 else {
            searchResults = []
            return
        }

        isSearching = true

        // Simulate API delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            // Demo results
            searchResults = GuestSearchResult.samples.filter { guest in
                guest.name.localizedCaseInsensitiveContains(searchText) ||
                guest.email.localizedCaseInsensitiveContains(searchText) ||
                guest.phone.contains(searchText) ||
                guest.confirmationNumber.localizedCaseInsensitiveContains(searchText)
            }
            isSearching = false
        }
    }
}

struct GuestSearchResult: Identifiable {
    let id: String
    let name: String
    let email: String
    let phone: String
    let siteName: String
    let confirmationNumber: String
    let status: String
    let arrivalDate: Date

    static let samples: [GuestSearchResult] = [
        GuestSearchResult(id: "g1", name: "John Smith", email: "john@example.com", phone: "(555) 123-4567", siteName: "A-01", confirmationNumber: "CAMP-001234", status: "confirmed", arrivalDate: Date()),
        GuestSearchResult(id: "g2", name: "Sarah Johnson", email: "sarah.j@email.com", phone: "(555) 987-6543", siteName: "B-03", confirmationNumber: "CAMP-001235", status: "checked_in", arrivalDate: Date().addingTimeInterval(-86400)),
        GuestSearchResult(id: "g3", name: "Mike Williams", email: "mike.w@gmail.com", phone: "(555) 456-7890", siteName: "C-02", confirmationNumber: "CAMP-001236", status: "pending", arrivalDate: Date().addingTimeInterval(86400)),
        GuestSearchResult(id: "g4", name: "Emily Davis", email: "emily.d@work.com", phone: "(555) 321-0987", siteName: "A-05", confirmationNumber: "CAMP-001237", status: "confirmed", arrivalDate: Date().addingTimeInterval(86400 * 2))
    ]
}

struct GuestSearchRow: View {
    let guest: GuestSearchResult
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Avatar
                Circle()
                    .fill(Color.campPrimary.opacity(0.15))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Text(initials)
                            .font(.campLabel)
                            .foregroundColor(.campPrimary)
                    )

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(guest.name)
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        StatusBadge(rawValue: guest.status, size: .small)
                    }

                    HStack(spacing: 8) {
                        Text(guest.siteName)
                            .font(.campCaption)
                            .foregroundColor(.campInfo)

                        Text(guest.confirmationNumber)
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.campTextHint)
            }
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }

    private var initials: String {
        let parts = guest.name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))"
        }
        return String(guest.name.prefix(2))
    }
}

// MARK: - Guest Detail Sheet

struct GuestDetailSheet: View {
    let guest: GuestSearchResult
    @Environment(\.dismiss) private var dismiss
    @State private var showCheckIn = false
    @State private var showCheckOut = false
    @State private var showReservation = false
    @State private var showMessageComposer = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Guest header
                    VStack(spacing: 12) {
                        Circle()
                            .fill(Color.campPrimary.opacity(0.15))
                            .frame(width: 80, height: 80)
                            .overlay(
                                Text(initials)
                                    .font(.system(size: 28, weight: .semibold))
                                    .foregroundColor(.campPrimary)
                            )

                        Text(guest.name)
                            .font(.campHeading2)
                            .foregroundColor(.campTextPrimary)

                        StatusBadge(rawValue: guest.status, size: .medium)
                    }
                    .padding(.top, 20)

                    // Reservation info
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Reservation")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 12) {
                            HStack {
                                Text("Confirmation")
                                    .font(.campCaption)
                                    .foregroundColor(.campTextHint)
                                Spacer()
                                Text(guest.confirmationNumber)
                                    .font(.campLabel)
                                    .foregroundColor(.campPrimary)
                            }

                            HStack {
                                Text("Site")
                                    .font(.campCaption)
                                    .foregroundColor(.campTextHint)
                                Spacer()
                                Text(guest.siteName)
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                            }

                            HStack {
                                Text("Arrival")
                                    .font(.campCaption)
                                    .foregroundColor(.campTextHint)
                                Spacer()
                                Text(formatDate(guest.arrivalDate))
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)

                    // Contact info
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Contact")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 12) {
                            Button {
                                if let url = URL(string: "mailto:\(guest.email)") {
                                    UIApplication.shared.open(url)
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.campPrimary)
                                        .frame(width: 24)
                                    Text(guest.email)
                                        .font(.campBody)
                                        .foregroundColor(.campPrimary)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(.campTextHint)
                                }
                            }

                            Divider()

                            Button {
                                if let url = URL(string: "tel:\(guest.phone.filter { $0.isNumber })") {
                                    UIApplication.shared.open(url)
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "phone.fill")
                                        .foregroundColor(.campPrimary)
                                        .frame(width: 24)
                                    Text(guest.phone)
                                        .font(.campBody)
                                        .foregroundColor(.campPrimary)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12))
                                        .foregroundColor(.campTextHint)
                                }
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)

                    // Actions
                    VStack(spacing: 12) {
                        if guest.status == "confirmed" {
                            PrimaryButton("Check In Guest", icon: "arrow.down.circle") {
                                showCheckIn = true
                            }
                        } else if guest.status == "checked_in" {
                            PrimaryButton("Check Out Guest", icon: "arrow.up.circle") {
                                showCheckOut = true
                            }
                        }

                        SecondaryButton("View Full Reservation") {
                            showReservation = true
                        }

                        Button {
                            showMessageComposer = true
                        } label: {
                            HStack {
                                Image(systemName: "message.fill")
                                Text("Send Message")
                            }
                            .font(.campLabel)
                            .foregroundColor(.campPrimary)
                        }
                        .padding(.top, 8)
                    }
                }
                .padding(16)
            }
            .background(Color.campBackground)
            .navigationTitle("Guest Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .alert("Check In Guest?", isPresented: $showCheckIn) {
                Button("Cancel", role: .cancel) { }
                Button("Check In") {
                    // Would call API
                    dismiss()
                }
            } message: {
                Text("Check in \(guest.name) to \(guest.siteName)?")
            }
            .alert("Check Out Guest?", isPresented: $showCheckOut) {
                Button("Cancel", role: .cancel) { }
                Button("Check Out") {
                    // Would call API
                    dismiss()
                }
            } message: {
                Text("Check out \(guest.name) from \(guest.siteName)?")
            }
            .sheet(isPresented: $showReservation) {
                GuestReservationDetailSheet(guest: guest)
            }
            .sheet(isPresented: $showMessageComposer) {
                GuestMessageComposerSheet(guest: guest)
            }
        }
    }

    private var initials: String {
        let parts = guest.name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))"
        }
        return String(guest.name.prefix(2))
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter.string(from: date)
    }
}

// MARK: - Guest Reservation Detail Sheet

struct GuestReservationDetailSheet: View {
    let guest: GuestSearchResult
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Reservation header
                    VStack(spacing: 8) {
                        Text(guest.confirmationNumber)
                            .font(.system(size: 14, weight: .medium, design: .monospaced))
                            .foregroundColor(.campPrimary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.campPrimary.opacity(0.1))
                            .cornerRadius(6)

                        Text(guest.name)
                            .font(.campHeading2)
                            .foregroundColor(.campTextPrimary)

                        StatusBadge(rawValue: guest.status, size: .medium)
                    }
                    .padding(.top, 20)

                    // Stay details
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Stay Details")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 16) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Check-in")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextHint)
                                    Text(formatFullDate(guest.arrivalDate))
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)
                                    Text("After 3:00 PM")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextSecondary)
                                }

                                Spacer()

                                Image(systemName: "arrow.right")
                                    .foregroundColor(.campTextHint)

                                Spacer()

                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("Check-out")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextHint)
                                    Text(formatFullDate(guest.arrivalDate.addingTimeInterval(86400 * 3)))
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)
                                    Text("Before 11:00 AM")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextSecondary)
                                }
                            }

                            Divider()

                            HStack {
                                Label(guest.siteName, systemImage: "tent.fill")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                                Text("3 nights")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextSecondary)
                            }

                            HStack {
                                Label("2 Adults, 1 Child", systemImage: "person.2.fill")
                                    .font(.campBody)
                                    .foregroundColor(.campTextSecondary)
                                Spacer()
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)

                    // Payment summary
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Payment Summary")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 12) {
                            HStack {
                                Text("Site Rate (3 nights)")
                                    .font(.campBody)
                                    .foregroundColor(.campTextSecondary)
                                Spacer()
                                Text("$150.00")
                                    .font(.campBody)
                                    .foregroundColor(.campTextPrimary)
                            }

                            HStack {
                                Text("Taxes & Fees")
                                    .font(.campBody)
                                    .foregroundColor(.campTextSecondary)
                                Spacer()
                                Text("$18.75")
                                    .font(.campBody)
                                    .foregroundColor(.campTextPrimary)
                            }

                            Divider()

                            HStack {
                                Text("Total")
                                    .font(.campHeading3)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                                Text("$168.75")
                                    .font(.campHeading2)
                                    .foregroundColor(.campPrimary)
                            }

                            HStack {
                                Text("Paid")
                                    .font(.campBody)
                                    .foregroundColor(.campTextSecondary)
                                Spacer()
                                Text("$168.75")
                                    .font(.campBody)
                                    .foregroundColor(.campSuccess)
                            }

                            HStack {
                                Text("Balance Due")
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                                Text("$0.00")
                                    .font(.campLabel)
                                    .foregroundColor(.campSuccess)
                            }
                            .padding(12)
                            .background(Color.campSuccess.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)

                    // Contact info
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Contact")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        VStack(spacing: 12) {
                            HStack {
                                Image(systemName: "envelope.fill")
                                    .foregroundColor(.campTextHint)
                                    .frame(width: 24)
                                Text(guest.email)
                                    .font(.campBody)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                            }

                            HStack {
                                Image(systemName: "phone.fill")
                                    .foregroundColor(.campTextHint)
                                    .frame(width: 24)
                                Text(guest.phone)
                                    .font(.campBody)
                                    .foregroundColor(.campTextPrimary)
                                Spacer()
                            }
                        }
                    }
                    .padding(16)
                    .background(Color.campSurface)
                    .cornerRadius(12)

                    // Notes
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Notes")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)

                        Text("Returning guest - prefers quiet site away from playground. Has small dog (paid pet fee).")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.campSurface)
                    .cornerRadius(12)
                }
                .padding(16)
            }
            .background(Color.campBackground)
            .navigationTitle("Reservation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func formatFullDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d, yyyy"
        return formatter.string(from: date)
    }
}

// MARK: - Guest Message Composer Sheet

struct GuestMessageComposerSheet: View {
    let guest: GuestSearchResult
    @Environment(\.dismiss) private var dismiss
    @State private var messageText = ""
    @State private var isSending = false
    @State private var showSentConfirmation = false
    @FocusState private var isTextFieldFocused: Bool

    let quickReplies = [
        "Your site is ready for check-in!",
        "Just checking in - is there anything you need?",
        "Reminder: Check-out is at 11 AM tomorrow.",
        "The weather forecast shows rain - just a heads up!"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Recipient header
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.campPrimary.opacity(0.15))
                        .frame(width: 44, height: 44)
                        .overlay(
                            Text(initials)
                                .font(.campLabel)
                                .foregroundColor(.campPrimary)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(guest.name)
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)
                        Text(guest.siteName)
                            .font(.campCaption)
                            .foregroundColor(.campTextSecondary)
                    }

                    Spacer()
                }
                .padding(16)
                .background(Color.campSurface)

                Divider()

                // Quick replies
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(quickReplies, id: \.self) { reply in
                            Button {
                                messageText = reply
                            } label: {
                                Text(reply)
                                    .font(.campCaption)
                                    .foregroundColor(.campPrimary)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Color.campPrimary.opacity(0.1))
                                    .cornerRadius(16)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .background(Color.campBackground)

                Divider()

                // Message input
                VStack(spacing: 0) {
                    TextEditor(text: $messageText)
                        .font(.campBody)
                        .padding(12)
                        .focused($isTextFieldFocused)
                        .frame(minHeight: 150)

                    Divider()

                    HStack {
                        Text("\(messageText.count) characters")
                            .font(.campCaption)
                            .foregroundColor(.campTextHint)

                        Spacer()

                        Button {
                            Task { await sendMessage() }
                        } label: {
                            HStack(spacing: 6) {
                                if isSending {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "paperplane.fill")
                                }
                                Text("Send")
                            }
                            .font(.campLabel)
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? Color.campTextHint : Color.campPrimary)
                            .cornerRadius(20)
                        }
                        .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
                    }
                    .padding(12)
                }
                .background(Color.campSurface)
            }
            .background(Color.campBackground)
            .navigationTitle("Send Message")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .alert("Message Sent", isPresented: $showSentConfirmation) {
                Button("OK") { dismiss() }
            } message: {
                Text("Your message has been sent to \(guest.name).")
            }
            .onAppear {
                isTextFieldFocused = true
            }
        }
    }

    private var initials: String {
        let parts = guest.name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))"
        }
        return String(guest.name.prefix(2))
    }

    private func sendMessage() async {
        isSending = true
        try? await Task.sleep(for: .seconds(1))
        isSending = false
        showSentConfirmation = true
    }
}

// MARK: - Quick Sale Sheet

enum QuickSalePaymentMethod: String, CaseIterable {
    case card = "Card"
    case cash = "Cash"
    case onAccount = "On Account"

    var icon: String {
        switch self {
        case .card: return "creditcard.fill"
        case .cash: return "banknote.fill"
        case .onAccount: return "person.text.rectangle.fill"
        }
    }
}

struct QuickSaleSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var amount = ""
    @State private var description = ""
    @State private var selectedCategory = "General"
    @State private var selectedPaymentMethod: QuickSalePaymentMethod = .card
    @State private var linkedGuest: GuestSearchResult?
    @State private var showGuestSearch = false
    @State private var isProcessing = false
    @State private var showSuccess = false
    @State private var currentStep = 1 // 1 = details, 2 = payment

    let categories = ["General", "Firewood", "Ice", "Store", "Services", "Other"]

    var body: some View {
        NavigationStack {
            if showSuccess {
                successView
            } else if currentStep == 1 {
                detailsStep
            } else {
                paymentStep
            }
        }
    }

    // MARK: - Step 1: Sale Details

    private var detailsStep: some View {
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

                // Details card
                VStack(alignment: .leading, spacing: 16) {
                    FormTextField(label: "Description", text: $description, placeholder: "What's this for?")

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

                    // Link to guest/reservation
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Link to Guest (Optional)")
                            .font(.campLabel)
                            .foregroundColor(.campTextSecondary)

                        if let guest = linkedGuest {
                            // Show selected guest
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(Color.campPrimary.opacity(0.15))
                                    .frame(width: 44, height: 44)
                                    .overlay(
                                        Text(guestInitials(guest.name))
                                            .font(.campLabel)
                                            .foregroundColor(.campPrimary)
                                    )

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(guest.name)
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)
                                    Text("\(guest.siteName) - \(guest.confirmationNumber)")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextSecondary)
                                }

                                Spacer()

                                Button {
                                    linkedGuest = nil
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.campTextHint)
                                }
                            }
                            .padding(12)
                            .background(Color.campBackground)
                            .cornerRadius(10)
                        } else {
                            Button {
                                showGuestSearch = true
                            } label: {
                                HStack {
                                    Image(systemName: "magnifyingglass")
                                        .foregroundColor(.campTextHint)
                                    Text("Search for guest or reservation")
                                        .font(.campBody)
                                        .foregroundColor(.campTextHint)
                                    Spacer()
                                }
                                .padding(14)
                                .background(Color.campBackground)
                                .cornerRadius(10)
                            }
                        }
                    }
                }
                .padding(20)
                .background(Color.campSurface)
                .cornerRadius(16)

                // Continue button
                PrimaryButton("Continue to Payment", icon: "arrow.right") {
                    currentStep = 2
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
        .sheet(isPresented: $showGuestSearch) {
            QuickSaleGuestSearchSheet(selectedGuest: $linkedGuest)
        }
    }

    // MARK: - Step 2: Payment

    private var paymentStep: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Order summary
                VStack(spacing: 16) {
                    HStack {
                        Text("Order Summary")
                            .font(.campLabel)
                            .foregroundColor(.campTextPrimary)
                        Spacer()
                        Button("Edit") {
                            currentStep = 1
                        }
                        .font(.campCaption)
                        .foregroundColor(.campPrimary)
                    }

                    VStack(spacing: 12) {
                        HStack {
                            Text(description.isEmpty ? selectedCategory : description)
                                .font(.campBody)
                                .foregroundColor(.campTextPrimary)
                            Spacer()
                            Text(formattedAmount)
                                .font(.campLabel)
                                .foregroundColor(.campTextPrimary)
                        }

                        if let guest = linkedGuest {
                            Divider()
                            HStack(spacing: 8) {
                                Image(systemName: "person.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.campTextHint)
                                Text(guest.name)
                                    .font(.campCaption)
                                    .foregroundColor(.campTextSecondary)
                                Text("-")
                                    .foregroundColor(.campTextHint)
                                Text(guest.siteName)
                                    .font(.campCaption)
                                    .foregroundColor(.campTextSecondary)
                            }
                        }

                        Divider()

                        HStack {
                            Text("Total")
                                .font(.campHeading3)
                                .foregroundColor(.campTextPrimary)
                            Spacer()
                            Text(formattedAmount)
                                .font(.campHeading2)
                                .foregroundColor(.campPrimary)
                        }
                    }
                }
                .padding(20)
                .background(Color.campSurface)
                .cornerRadius(16)

                // Payment method selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Payment Method")
                        .font(.campLabel)
                        .foregroundColor(.campTextPrimary)

                    VStack(spacing: 10) {
                        ForEach(QuickSalePaymentMethod.allCases, id: \.self) { method in
                            Button {
                                selectedPaymentMethod = method
                            } label: {
                                HStack(spacing: 14) {
                                    Image(systemName: method.icon)
                                        .font(.system(size: 20))
                                        .foregroundColor(selectedPaymentMethod == method ? .campPrimary : .campTextSecondary)
                                        .frame(width: 28)

                                    Text(method.rawValue)
                                        .font(.campLabel)
                                        .foregroundColor(.campTextPrimary)

                                    Spacer()

                                    Image(systemName: selectedPaymentMethod == method ? "checkmark.circle.fill" : "circle")
                                        .foregroundColor(selectedPaymentMethod == method ? .campPrimary : .campBorder)
                                }
                                .padding(16)
                                .background(selectedPaymentMethod == method ? Color.campPrimary.opacity(0.05) : Color.campSurface)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(selectedPaymentMethod == method ? Color.campPrimary : Color.campBorder, lineWidth: selectedPaymentMethod == method ? 2 : 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if selectedPaymentMethod == .onAccount && linkedGuest == nil {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.campWarning)
                            Text("Link a guest to charge to their account")
                                .font(.campCaption)
                                .foregroundColor(.campWarning)
                        }
                        .padding(12)
                        .background(Color.campWarning.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
                .padding(20)
                .background(Color.campSurface)
                .cornerRadius(16)

                // Charge button
                PrimaryButton("Charge \(formattedAmount)", icon: selectedPaymentMethod.icon, isLoading: isProcessing) {
                    Task { await processSale() }
                }
                .disabled(selectedPaymentMethod == .onAccount && linkedGuest == nil)
            }
            .padding(16)
        }
        .background(Color.campBackground)
        .navigationTitle("Payment")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Back") {
                    currentStep = 1
                }
            }
        }
    }

    // MARK: - Success View

    private var successView: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.campSuccess)

            Text("Payment Complete")
                .font(.campDisplaySmall)
                .foregroundColor(.campTextPrimary)

            Text(formattedAmount)
                .font(.campHeading2)
                .foregroundColor(.campPrimary)

            Text("Paid via \(selectedPaymentMethod.rawValue)")
                .font(.campBody)
                .foregroundColor(.campTextSecondary)

            if let guest = linkedGuest {
                Text("Charged to \(guest.name)")
                    .font(.campCaption)
                    .foregroundColor(.campTextHint)
            }

            Spacer()

            VStack(spacing: 12) {
                PrimaryButton("New Sale", icon: "plus") {
                    resetForm()
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

    // MARK: - Helpers

    private var formattedAmount: String {
        guard let value = Double(amount), value > 0 else { return "$0.00" }
        return String(format: "$%.2f", value)
    }

    private func guestInitials(_ name: String) -> String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))"
        }
        return String(name.prefix(2))
    }

    private func resetForm() {
        amount = ""
        description = ""
        selectedCategory = "General"
        selectedPaymentMethod = .card
        linkedGuest = nil
        currentStep = 1
        showSuccess = false
    }

    private func processSale() async {
        isProcessing = true
        try? await Task.sleep(for: .seconds(1.5))
        isProcessing = false
        showSuccess = true
    }
}

// MARK: - Quick Sale Guest Search

struct QuickSaleGuestSearchSheet: View {
    @Binding var selectedGuest: GuestSearchResult?
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var searchResults: [GuestSearchResult] = []
    @State private var isSearching = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.campTextHint)

                    TextField("Search by name, phone, or confirmation #", text: $searchText)
                        .font(.campBody)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                .padding(14)
                .background(Color.campBackground)
                .cornerRadius(12)
                .padding(16)

                Divider()

                // Results
                if isSearching {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if searchText.count < 2 {
                    VStack(spacing: 16) {
                        Spacer()
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.campTextHint)
                        Text("Search for a guest")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                        Spacer()
                    }
                } else if searchResults.isEmpty {
                    VStack(spacing: 16) {
                        Spacer()
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 48))
                            .foregroundColor(.campTextHint)
                        Text("No guests found")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                        Spacer()
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(searchResults) { guest in
                                Button {
                                    selectedGuest = guest
                                    dismiss()
                                } label: {
                                    HStack(spacing: 14) {
                                        Circle()
                                            .fill(Color.campPrimary.opacity(0.15))
                                            .frame(width: 44, height: 44)
                                            .overlay(
                                                Text(guestInitials(guest.name))
                                                    .font(.campLabel)
                                                    .foregroundColor(.campPrimary)
                                            )

                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(guest.name)
                                                .font(.campLabel)
                                                .foregroundColor(.campTextPrimary)

                                            HStack(spacing: 8) {
                                                Text(guest.siteName)
                                                    .font(.campCaption)
                                                    .foregroundColor(.campInfo)
                                                Text(guest.confirmationNumber)
                                                    .font(.campCaption)
                                                    .foregroundColor(.campTextHint)
                                            }
                                        }

                                        Spacer()

                                        Image(systemName: "plus.circle.fill")
                                            .foregroundColor(.campPrimary)
                                    }
                                    .padding(.vertical, 12)
                                    .padding(.horizontal, 16)
                                }
                                .buttonStyle(.plain)

                                Divider()
                                    .padding(.leading, 74)
                            }
                        }
                    }
                }
            }
            .background(Color.campSurface)
            .navigationTitle("Link Guest")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onChange(of: searchText) { _ in
                performSearch()
            }
        }
    }

    private func guestInitials(_ name: String) -> String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))"
        }
        return String(name.prefix(2))
    }

    private func performSearch() {
        guard searchText.count >= 2 else {
            searchResults = []
            return
        }

        isSearching = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            searchResults = GuestSearchResult.samples.filter { guest in
                guest.name.localizedCaseInsensitiveContains(searchText) ||
                guest.phone.contains(searchText) ||
                guest.confirmationNumber.localizedCaseInsensitiveContains(searchText)
            }
            isSearching = false
        }
    }
}

// MARK: - Form Components

struct FormTextField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.campLabel)
                .foregroundColor(.campTextSecondary)

            TextField(placeholder, text: $text)
                .font(.campBody)
                .keyboardType(keyboardType)
                .autocorrectionDisabled(keyboardType != .default)
                .textInputAutocapitalization(keyboardType == .emailAddress ? .never : .words)
                .padding(14)
                .background(Color.campBackground)
                .cornerRadius(10)
        }
    }
}

struct DatePickerField: View {
    let label: String
    @Binding var date: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.campLabel)
                .foregroundColor(.campTextSecondary)

            DatePicker("", selection: $date, displayedComponents: .date)
                .datePickerStyle(.compact)
                .labelsHidden()
        }
    }
}

struct StepperField: View {
    let label: String
    @Binding var value: Int
    let range: ClosedRange<Int>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.campLabel)
                .foregroundColor(.campTextSecondary)

            HStack {
                Button {
                    if value > range.lowerBound { value -= 1 }
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(value <= range.lowerBound ? .campTextHint : .campPrimary)
                }
                .disabled(value <= range.lowerBound)

                Text("\(value)")
                    .font(.campHeading3)
                    .foregroundColor(.campTextPrimary)
                    .frame(width: 40)

                Button {
                    if value < range.upperBound { value += 1 }
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 28))
                        .foregroundColor(value >= range.upperBound ? .campTextHint : .campPrimary)
                }
                .disabled(value >= range.upperBound)
            }
            .padding(10)
            .background(Color.campBackground)
            .cornerRadius(10)
        }
    }
}

// MARK: - Campground Selector Sheet

struct CampgroundSelectorSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: StaffAppState

    var body: some View {
        NavigationStack {
            List {
                ForEach(appState.campgrounds, id: \.id) { campground in
                    Button {
                        appState.selectCampground(campground)
                        dismiss()
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: "tent.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.campPrimary)
                                .frame(width: 40)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(campground.name)
                                    .font(.campLabel)
                                    .foregroundColor(.campTextPrimary)
                                if let city = campground.city, let state = campground.state {
                                    Text("\(city), \(state)")
                                        .font(.campCaption)
                                        .foregroundColor(.campTextSecondary)
                                }
                            }

                            Spacer()

                            if appState.currentCampground?.id == campground.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.campPrimary)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle("Select Campground")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - All Arrivals Sheet

struct AllArrivalsSheet: View {
    let arrivals: [Reservation]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if arrivals.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "arrow.down.circle")
                            .font(.system(size: 48))
                            .foregroundColor(.campTextHint)
                        Text("No arrivals today")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(arrivals, id: \.id) { reservation in
                            ArrivalListRow(reservation: reservation)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .background(Color.campBackground)
            .navigationTitle("Today's Arrivals")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

struct ArrivalListRow: View {
    let reservation: Reservation

    var body: some View {
        HStack(spacing: 14) {
            Circle()
                .fill(Color.campSuccess.opacity(0.1))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: "arrow.down.circle")
                        .foregroundColor(.campSuccess)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(reservation.guestName ?? "Guest")
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)

                HStack(spacing: 8) {
                    Text(reservation.siteName ?? "Site")
                        .font(.campCaption)
                        .foregroundColor(.campInfo)

                    StatusBadge(rawValue: reservation.status, size: .small)
                }
            }

            Spacer()

            Button("Check In") {
                // Perform check-in
            }
            .font(.campLabel)
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.campSuccess)
            .cornerRadius(8)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - All Departures Sheet

struct AllDeparturesSheet: View {
    let departures: [Reservation]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if departures.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "arrow.up.circle")
                            .font(.system(size: 48))
                            .foregroundColor(.campTextHint)
                        Text("No departures today")
                            .font(.campBody)
                            .foregroundColor(.campTextSecondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(departures, id: \.id) { reservation in
                            DepartureListRow(reservation: reservation)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .background(Color.campBackground)
            .navigationTitle("Today's Departures")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

struct DepartureListRow: View {
    let reservation: Reservation

    var body: some View {
        HStack(spacing: 14) {
            Circle()
                .fill(Color.campWarning.opacity(0.1))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: "arrow.up.circle")
                        .foregroundColor(.campWarning)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(reservation.guestName ?? "Guest")
                    .font(.campLabel)
                    .foregroundColor(.campTextPrimary)

                HStack(spacing: 8) {
                    Text(reservation.siteName ?? "Site")
                        .font(.campCaption)
                        .foregroundColor(.campInfo)

                    StatusBadge(rawValue: reservation.status, size: .small)
                }
            }

            Spacer()

            Button("Check Out") {
                // Perform check-out
            }
            .font(.campLabel)
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.campWarning)
            .cornerRadius(8)
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    StaffDashboardView()
        .environmentObject(StaffAppState())
}
