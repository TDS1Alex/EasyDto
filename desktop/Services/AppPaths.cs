using System.IO;

namespace EasyDTO.Desktop.Services;

/// <summary>
/// Определяет расположение корня проекта EasyDTO относительно приложения.
/// </summary>
public static class AppPaths
{
    public static string? FindRepositoryRoot()
    {
        var configuredRoot = Environment.GetEnvironmentVariable("EASYDTO_REPO_ROOT");
        if (!string.IsNullOrWhiteSpace(configuredRoot) && IsRepositoryRoot(configuredRoot))
        {
            return Path.GetFullPath(configuredRoot);
        }

        var starts = new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() };
        foreach (var start in starts)
        {
            var directory = new DirectoryInfo(start);
            for (var depth = 0; depth < 10 && directory is not null; depth++)
            {
                if (IsRepositoryRoot(directory.FullName))
                {
                    return directory.FullName;
                }

                directory = directory.Parent;
            }
        }

        return null;
    }

    public static bool IsRepositoryRoot(string directory) =>
        File.Exists(Path.Combine(directory, "ai-translator", "app.py")) &&
        Directory.Exists(Path.Combine(directory, "app"));

    public static string WebViewUserDataFolder =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "EasyDTO",
            "WebView2");
}
