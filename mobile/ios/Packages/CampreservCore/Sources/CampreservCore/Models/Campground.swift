import Foundation

// MARK: - Campground
public struct Campground: Identifiable, Equatable, Sendable {
    public let id: String
    public let organizationId: String?
    public let name: String
    public let slug: String?

    // Location
    public let city: String?
    public let state: String?
    public let country: String?
    public let address1: String?
    public let postalCode: String?
    public let latitude: Double?
    public let longitude: Double?
    public let timezone: String?

    // Contact
    public let phone: String?
    public let email: String?
    public let website: String?

    // Operations
    public let seasonStart: String?
    public let seasonEnd: String?
    public let checkInTime: String?
    public let checkOutTime: String?

    // Branding
    public let logoUrl: String?
    public let primaryColor: String?

    // Financial
    public let currency: String?

    public let createdAt: Date?
    public let updatedAt: Date?

    // MARK: - Computed Properties

    public var formattedLocation: String? {
        var parts: [String] = []
        if let city = city, !city.isEmpty { parts.append(city) }
        if let state = state, !state.isEmpty { parts.append(state) }
        return parts.isEmpty ? nil : parts.joined(separator: ", ")
    }

    public var hasCoordinates: Bool {
        latitude != nil && longitude != nil
    }

    /// Convenience computed property for safe slug access
    public var safeSlug: String {
        slug ?? id
    }

    // MARK: - Convenience Init for Demo

    public init(
        id: String,
        organizationId: String? = nil,
        name: String,
        slug: String? = nil,
        city: String? = nil,
        state: String? = nil,
        country: String? = nil,
        address1: String? = nil,
        postalCode: String? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        timezone: String? = nil,
        phone: String? = nil,
        email: String? = nil,
        website: String? = nil,
        seasonStart: String? = nil,
        seasonEnd: String? = nil,
        checkInTime: String? = nil,
        checkOutTime: String? = nil,
        logoUrl: String? = nil,
        primaryColor: String? = nil,
        currency: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.organizationId = organizationId
        self.name = name
        self.slug = slug
        self.city = city
        self.state = state
        self.country = country
        self.address1 = address1
        self.postalCode = postalCode
        self.latitude = latitude
        self.longitude = longitude
        self.timezone = timezone
        self.phone = phone
        self.email = email
        self.website = website
        self.seasonStart = seasonStart
        self.seasonEnd = seasonEnd
        self.checkInTime = checkInTime
        self.checkOutTime = checkOutTime
        self.logoUrl = logoUrl
        self.primaryColor = primaryColor
        self.currency = currency
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Codable
extension Campground: Codable {
    enum CodingKeys: String, CodingKey {
        case id, organizationId, name, slug
        case city, state, country, address1, postalCode
        case latitude, longitude, timezone
        case phone, email, website
        case seasonStart, seasonEnd, checkInTime, checkOutTime
        case logoUrl, primaryColor, currency
        case createdAt, updatedAt
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        organizationId = try container.decodeIfPresent(String.self, forKey: .organizationId)
        name = try container.decode(String.self, forKey: .name)
        slug = try container.decodeIfPresent(String.self, forKey: .slug)

        city = try container.decodeIfPresent(String.self, forKey: .city)
        state = try container.decodeIfPresent(String.self, forKey: .state)
        country = try container.decodeIfPresent(String.self, forKey: .country)
        address1 = try container.decodeIfPresent(String.self, forKey: .address1)
        postalCode = try container.decodeIfPresent(String.self, forKey: .postalCode)
        timezone = try container.decodeIfPresent(String.self, forKey: .timezone)

        // Prisma Decimal fields may come as String or Number
        latitude = Self.decodeFlexibleDouble(from: container, forKey: .latitude)
        longitude = Self.decodeFlexibleDouble(from: container, forKey: .longitude)

        phone = try container.decodeIfPresent(String.self, forKey: .phone)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        website = try container.decodeIfPresent(String.self, forKey: .website)

        seasonStart = try container.decodeIfPresent(String.self, forKey: .seasonStart)
        seasonEnd = try container.decodeIfPresent(String.self, forKey: .seasonEnd)
        checkInTime = try container.decodeIfPresent(String.self, forKey: .checkInTime)
        checkOutTime = try container.decodeIfPresent(String.self, forKey: .checkOutTime)

        logoUrl = try container.decodeIfPresent(String.self, forKey: .logoUrl)
        primaryColor = try container.decodeIfPresent(String.self, forKey: .primaryColor)
        currency = try container.decodeIfPresent(String.self, forKey: .currency)

        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
        updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(organizationId, forKey: .organizationId)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(slug, forKey: .slug)
        try container.encodeIfPresent(city, forKey: .city)
        try container.encodeIfPresent(state, forKey: .state)
        try container.encodeIfPresent(country, forKey: .country)
        try container.encodeIfPresent(address1, forKey: .address1)
        try container.encodeIfPresent(postalCode, forKey: .postalCode)
        try container.encodeIfPresent(latitude, forKey: .latitude)
        try container.encodeIfPresent(longitude, forKey: .longitude)
        try container.encodeIfPresent(timezone, forKey: .timezone)
        try container.encodeIfPresent(phone, forKey: .phone)
        try container.encodeIfPresent(email, forKey: .email)
        try container.encodeIfPresent(website, forKey: .website)
        try container.encodeIfPresent(seasonStart, forKey: .seasonStart)
        try container.encodeIfPresent(seasonEnd, forKey: .seasonEnd)
        try container.encodeIfPresent(checkInTime, forKey: .checkInTime)
        try container.encodeIfPresent(checkOutTime, forKey: .checkOutTime)
        try container.encodeIfPresent(logoUrl, forKey: .logoUrl)
        try container.encodeIfPresent(primaryColor, forKey: .primaryColor)
        try container.encodeIfPresent(currency, forKey: .currency)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt, forKey: .updatedAt)
    }

    /// Decode a Double that might be a String (Prisma Decimal) or Number
    private static func decodeFlexibleDouble(from container: KeyedDecodingContainer<CodingKeys>, forKey key: CodingKeys) -> Double? {
        // Try decoding as Double first
        if let value = try? container.decodeIfPresent(Double.self, forKey: key) {
            return value
        }
        // Try decoding as String and converting
        if let stringValue = try? container.decodeIfPresent(String.self, forKey: key) {
            return Double(stringValue)
        }
        return nil
    }
}

// MARK: - Campground Summary (for lists)
public struct CampgroundSummary: Identifiable, Codable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let slug: String
    public let role: String?

    public init(id: String, name: String, slug: String, role: String? = nil) {
        self.id = id
        self.name = name
        self.slug = slug
        self.role = role
    }
}
