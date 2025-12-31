import SwiftUI
import CampreservCore

/// Central app state manager for staff app
@MainActor
final class StaffAppState: ObservableObject {

    @Published var isLoading = true
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var currentCampground: Campground?
    @Published var campgrounds: [Campground] = []
    @Published var error: Error?

    private let tokenManager: TokenManager
    private let apiClient: APIClient

    // UserDefaults keys for demo mode persistence
    private let kDemoModeKey = "campreserv.staff.demoMode"
    private let kSelectedCampgroundKey = "campreserv.staff.selectedCampground"

    init() {
        let keychain = KeychainService(serviceName: "com.campreserv.staff")
        self.tokenManager = TokenManager(keychain: keychain)

        let baseURL = URL(string: StaffConfiguration.apiBaseURL)!
        self.apiClient = APIClient(baseURL: baseURL, tokenManager: tokenManager)
    }

    // MARK: - Auth State

    func checkAuthState() async {
        isLoading = true
        defer { isLoading = false }

        // Check for demo mode first
        if UserDefaults.standard.bool(forKey: kDemoModeKey) {
            await restoreDemoSession()
            return
        }

        do {
            _ = try await tokenManager.getValidToken()
            isAuthenticated = true
            await loadProfile()
            await loadCampgrounds()
        } catch {
            isAuthenticated = false
            currentUser = nil
            currentCampground = nil
        }
    }

    private func restoreDemoSession() async {
        isAuthenticated = true
        currentUser = User(
            id: "demo-user",
            email: "demo@campreserv.com",
            firstName: "Demo",
            lastName: "Staff",
            platformRole: nil,
            campgrounds: [
                CampgroundSummary(id: "demo-campground-1", name: "Pines Campground & RV Resort", slug: "pines", role: "manager"),
                CampgroundSummary(id: "demo-campground-2", name: "Coastal Camping", slug: "coastal", role: "manager")
            ]
        )
        campgrounds = [
            Campground(
                id: "demo-campground-1",
                name: "Pines Campground & RV Resort",
                slug: "pines",
                city: "Lake Tahoe",
                state: "CA"
            ),
            Campground(
                id: "demo-campground-2",
                name: "Coastal Camping",
                slug: "coastal",
                city: "Santa Cruz",
                state: "CA"
            )
        ]

        // Restore selected campground
        if let savedCampgroundId = UserDefaults.standard.string(forKey: kSelectedCampgroundKey) {
            currentCampground = campgrounds.first { $0.id == savedCampgroundId }
        }
    }

    func loadProfile() async {
        do {
            currentUser = try await apiClient.request(.getProfile)
        } catch {
            self.error = error
        }
    }

    func loadCampgrounds() async {
        do {
            campgrounds = try await apiClient.request(.getCampgrounds)

            // Auto-select if only one campground
            if campgrounds.count == 1 {
                currentCampground = campgrounds.first
            }
        } catch {
            self.error = error
        }
    }

    // MARK: - Login

    func login(email: String, password: String, deviceId: String? = nil) async throws {
        // Demo mode - use demo@campreserv.com / demo123
        if email == "demo@campreserv.com" && password == "demo123" {
            try await Task.sleep(for: .seconds(1)) // Simulate network delay

            // Persist demo mode
            UserDefaults.standard.set(true, forKey: kDemoModeKey)

            await restoreDemoSession()
            return
        }

        // Real API login
        struct LoginResponse: Decodable {
            let accessToken: String
            let refreshToken: String
            let expiresIn: Int
        }

        let response: LoginResponse = try await apiClient.request(
            .mobileLogin(
                email: email,
                password: password,
                deviceId: deviceId,
                deviceName: UIDevice.current.name,
                platform: "ios",
                appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
            )
        )

        try await tokenManager.saveTokens(
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn
        )

        isAuthenticated = true
        await loadProfile()
        await loadCampgrounds()
    }

    // MARK: - Campground Selection

    func selectCampground(_ campground: Campground) {
        currentCampground = campground
        // Persist selection
        UserDefaults.standard.set(campground.id, forKey: kSelectedCampgroundKey)
    }

    // MARK: - Logout

    func logout() async {
        // Clear demo mode
        UserDefaults.standard.removeObject(forKey: kDemoModeKey)
        UserDefaults.standard.removeObject(forKey: kSelectedCampgroundKey)

        do {
            if let refreshToken = await tokenManager.getRefreshToken() {
                try await apiClient.request(.logout(refreshToken: refreshToken))
            }
        } catch {
            // Ignore logout errors
        }

        await tokenManager.clearTokens()
        isAuthenticated = false
        currentUser = nil
        currentCampground = nil
        campgrounds = []
    }

    // MARK: - API Access

    func getAPIClient() -> APIClient {
        return apiClient
    }

    func getCampgroundId() -> String? {
        return currentCampground?.id
    }
}

// MARK: - Configuration

enum StaffConfiguration {
    // Railway production API
    static let apiBaseURL = "https://camp-everydayapi-production.up.railway.app"
}
