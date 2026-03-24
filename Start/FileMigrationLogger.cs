using Domain;

namespace Start
{
    public class FileMigrationLogger(string filePath) : IMigrationLogger
    {
        public void LogFailure(MigrationFailure failure)
        {
            var line = $"[{failure.Timestamp:yyyy-MM-dd HH:mm:ss zzz}] {failure.Author}: {failure.Content} | Reason: {failure.Reason}";
            File.AppendAllText(filePath, line + Environment.NewLine);
        }
    }
}
