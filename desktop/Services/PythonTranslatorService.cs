using System.Collections.Concurrent;
using System.ComponentModel;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;

namespace EasyDTO.Desktop.Services;

/// <summary>
/// Управляет Python-переводчиком: проверяет уже запущенный сервис,
/// запускает собственный процесс при необходимости и завершает только его.
/// </summary>
public sealed class PythonTranslatorService : IDisposable
{
    public const string BaseUrl = "http://127.0.0.1:5000";

    private static readonly TimeSpan HealthRequestTimeout = TimeSpan.FromSeconds(2);

    private readonly HttpClient _http = new(new HttpClientHandler { UseProxy = false })
    {
        BaseAddress = new Uri(BaseUrl),
        Timeout = HealthRequestTimeout,
    };

    private readonly ConcurrentQueue<string> _log = new();
    private Process? _process;
    private bool _disposed;

    /// <summary>
    /// Гарантирует, что переводчик доступен. Возвращает true, если процесс
    /// был запущен этим экземпляром приложения (и должен быть завершён им же).
    /// </summary>
    public async Task<bool> EnsureStartedAsync(
        string translatorDirectory,
        string allowedOrigin,
        TimeSpan startupTimeout,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        if (await IsHealthyAsync(cancellationToken).ConfigureAwait(false))
        {
            if (!await AllowsOriginAsync(allowedOrigin, cancellationToken).ConfigureAwait(false))
            {
                throw new InvalidOperationException(
                    "Переводчик уже запущен, но не разрешает запросы с https://easydto.local. " +
                    "Закройте существующий процесс python app.py и запустите EasyDTO снова — " +
                    "приложение запустит переводчик с нужным CORS.");
            }

            progress?.Report("Используется уже запущенный переводчик.");
            return false;
        }

        if (await IsPortInUseAsync(cancellationToken).ConfigureAwait(false))
        {
            throw new InvalidOperationException(
                "Порт 5000 занят другим приложением. Освободите порт и повторите попытку.");
        }

        StartProcess(translatorDirectory, allowedOrigin);
        await WaitUntilHealthyAsync(startupTimeout, progress, cancellationToken).ConfigureAwait(false);
        progress?.Report("Переводчик готов.");
        return true;
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _http.GetAsync("/health", cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var document = JsonDocument.Parse(json);
            return document.RootElement.TryGetProperty("status", out var status) &&
                   string.Equals(status.GetString(), "ok", StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }

    private async Task<bool> AllowsOriginAsync(string origin, CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Options, "/translate");
            request.Headers.TryAddWithoutValidation("Origin", origin);
            request.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "POST");
            request.Headers.TryAddWithoutValidation("Access-Control-Request-Headers", "content-type");

            using var response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
            if (!response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values))
            {
                return false;
            }

            return values.Any(value =>
                value == "*" || string.Equals(value, origin, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }

    private static async Task<bool> IsPortInUseAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var client = new TcpClient();
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromMilliseconds(700));
            await client.ConnectAsync(IPAddress.Loopback, 5000, timeout.Token).ConfigureAwait(false);
            return true;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
        catch (SocketException)
        {
            return false;
        }
    }

    private void StartProcess(string translatorDirectory, string allowedOrigin)
    {
        var python = Environment.GetEnvironmentVariable("EASYDTO_PYTHON");
        if (string.IsNullOrWhiteSpace(python))
        {
            python = "python";
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = python,
            WorkingDirectory = translatorDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
        };
        startInfo.ArgumentList.Add("app.py");
        startInfo.Environment["PYTHONUNBUFFERED"] = "1";
        startInfo.Environment["PYTHONIOENCODING"] = "utf-8";
        startInfo.Environment["EASYDTO_ALLOWED_ORIGINS"] = BuildAllowedOrigins(allowedOrigin);

        var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
        process.OutputDataReceived += (_, args) => AddLog(args.Data);
        process.ErrorDataReceived += (_, args) => AddLog(args.Data);

        try
        {
            if (!process.Start())
            {
                throw new InvalidOperationException("Не удалось запустить Python-переводчик.");
            }
        }
        catch (Win32Exception exception)
        {
            process.Dispose();
            throw new InvalidOperationException(
                "Не удалось запустить Python. Убедитесь, что Python 3.10–3.12 установлен и доступен в PATH " +
                "(или задайте путь в переменной окружения EASYDTO_PYTHON). " +
                "Зависимости: pip install -r ai-translator\\requirements.txt.",
                exception);
        }

        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        _process = process;
    }

    private static string BuildAllowedOrigins(string desktopOrigin)
    {
        var origins = new[]
        {
            desktopOrigin,
            "http://easydto.local",
            "app://bundle",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        };

        return string.Join(",", origins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private async Task WaitUntilHealthyAsync(
        TimeSpan startupTimeout,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var lastReport = TimeSpan.Zero;

        while (stopwatch.Elapsed < startupTimeout)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var process = _process;
            if (process is not null && process.HasExited)
            {
                throw new InvalidOperationException(
                    $"Процесс переводчика завершился с кодом {process.ExitCode}.{FormatLog()}");
            }

            if (await IsHealthyAsync(cancellationToken).ConfigureAwait(false))
            {
                return;
            }

            if (stopwatch.Elapsed - lastReport >= TimeSpan.FromSeconds(5))
            {
                lastReport = stopwatch.Elapsed;
                progress?.Report($"Ожидание ответа /health… {stopwatch.Elapsed.TotalSeconds:0} с");
            }

            await Task.Delay(500, cancellationToken).ConfigureAwait(false);
        }

        Stop();
        throw new TimeoutException(
            $"Переводчик не запустился за {startupTimeout.TotalSeconds:0} секунд. " +
            "Проверьте, что установлены зависимости (pip install -r ai-translator\\requirements.txt) " +
            $"и доступна модель.{FormatLog()}");
    }

    private void AddLog(string? line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return;
        }

        _log.Enqueue(line.Trim());
        while (_log.Count > 100)
        {
            _log.TryDequeue(out _);
        }
    }

    private string FormatLog()
    {
        if (_log.IsEmpty)
        {
            return string.Empty;
        }

        var lines = _log.ToArray().TakeLast(20);
        return Environment.NewLine +
               "Последние строки вывода:" +
               Environment.NewLine +
               string.Join(Environment.NewLine, lines);
    }

    /// <summary>
    /// Завершает только процесс, запущенный этим приложением.
    /// </summary>
    public void Stop()
    {
        var process = _process;
        _process = null;

        if (process is null)
        {
            return;
        }

        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                process.WaitForExit(5000);
            }
        }
        catch (Exception)
        {
            // Процесс мог уже завершиться — при закрытии приложения это не критично.
        }
        finally
        {
            process.Dispose();
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        Stop();
        _http.Dispose();
    }
}
