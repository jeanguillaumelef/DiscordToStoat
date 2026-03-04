namespace Domain
{
    public record Message(string Author, string Content, DateTimeOffset Timestamp, IReadOnlyList<Attachment> Attachments);
}
