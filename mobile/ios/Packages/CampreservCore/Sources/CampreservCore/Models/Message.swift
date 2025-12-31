import Foundation

// MARK: - Guest-Staff Messaging

/// A message in a guest-staff conversation
public struct APIMessage: Codable, Identifiable {
    public let id: String
    public let content: String
    public let senderType: SenderType
    public let createdAt: Date
    public let readAt: Date?
    public let guest: MessageGuest?

    public enum SenderType: String, Codable {
        case guest
        case staff
    }

    public struct MessageGuest: Codable {
        public let id: String
        public let primaryFirstName: String?
        public let primaryLastName: String?
    }
}

/// A conversation with a guest (tied to a reservation)
public struct APIConversation: Codable, Identifiable {
    public var id: String { reservationId }

    public let reservationId: String
    public let guestName: String
    public let guestEmail: String?
    public let guestPhone: String?
    public let guestId: String?
    public let siteName: String
    public let siteType: String?
    public let status: String
    public let arrivalDate: Date?
    public let departureDate: Date?
    public let adults: Int?
    public let children: Int?
    public let pets: Int?
    public let totalAmountCents: Int?
    public let notes: String?
    public let messages: [APIMessage]
    public let unreadCount: Int
    public let lastMessage: APIMessage?
}

/// Request body for sending a message
public struct SendMessageRequest: Encodable {
    public let content: String
    public let senderType: String
    public let guestId: String

    public init(content: String, guestId: String) {
        self.content = content
        self.senderType = "staff"
        self.guestId = guestId
    }
}

// MARK: - Internal Messaging (Team Chat)

/// A participant in an internal conversation
public struct InternalParticipant: Codable, Identifiable {
    public let id: String
    public let conversationId: String
    public let userId: String
    public let joinedAt: Date
    public let user: ParticipantUser?

    public struct ParticipantUser: Codable {
        public let id: String
        public let firstName: String?
        public let lastName: String?
        public let email: String
    }
}

/// An internal conversation (channel or DM)
public struct APIInternalConversation: Codable, Identifiable {
    public let id: String
    public let name: String?
    public let type: ConversationType
    public let campgroundId: String
    public let createdAt: Date
    public let updatedAt: Date
    public let participants: [InternalParticipant]?
    public let messages: [APIInternalMessage]?

    public enum ConversationType: String, Codable {
        case channel
        case dm
    }
}

/// A message in an internal conversation
public struct APIInternalMessage: Codable, Identifiable {
    public let id: String
    public let content: String
    public let senderId: String
    public let conversationId: String
    public let createdAt: Date
    public let sender: MessageSender?

    public struct MessageSender: Codable {
        public let id: String
        public let firstName: String?
        public let lastName: String?
        public let email: String
    }
}

/// Request body for sending an internal message
public struct SendInternalMessageRequest: Encodable {
    public let content: String
    public let conversationId: String

    public init(content: String, conversationId: String) {
        self.content = content
        self.conversationId = conversationId
    }
}

/// Request body for creating an internal conversation
public struct CreateInternalConversationRequest: Encodable {
    public let name: String?
    public let type: String
    public let campgroundId: String
    public let participantIds: [String]

    public init(name: String?, type: String, campgroundId: String, participantIds: [String]) {
        self.name = name
        self.type = type
        self.campgroundId = campgroundId
        self.participantIds = participantIds
    }
}

// MARK: - Unread Count Response

public struct UnreadCountResponse: Codable {
    public let count: Int
}
