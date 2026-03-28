class NegotiationMessage {
  final int id;
  final int negotiation;
  final String senderName;
  final String messageText;
  final DateTime createdAt;
  final bool isMe;

  NegotiationMessage({
    required this.id,
    required this.negotiation,
    required this.senderName,
    required this.messageText,
    required this.createdAt,
    required this.isMe,
  });

  factory NegotiationMessage.fromJson(Map<String, dynamic> json, String currentUsername) {
    return NegotiationMessage(
      id: json['id'],
      negotiation: json['negotiation'],
      senderName: json['sender_name'] ?? 'System',
      messageText: json['text'],
      createdAt: DateTime.parse(json['created_at']),
      isMe: json['sender_name'] == currentUsername,
    );
  }
}
