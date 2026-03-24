namespace Domain
{
    public interface IMigrationLogger
    {
        void LogFailure(MigrationFailure failure);
    }
}
