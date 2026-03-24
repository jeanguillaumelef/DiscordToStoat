namespace Domain
{
    public record MigrationFailure(string Author, string Content, DateTimeOffset Timestamp, string Reason);
}
