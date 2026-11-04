using System.IO;
using System.Threading;
using System.Windows;
using EasyDTO.Desktop.Services;
using Microsoft.Web.WebView2.Core;

namespace EasyDTO.Desktop;

public partial class MainWindow : Window
{
    private const string VirtualHostName = "easydto.local";
    private const string StartUrl = "https://easydto.local/index.html";
    private const string AllowedOrigin = "https://easydto.local";
    private static readonly TimeSpan WebViewNavigationTimeout = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan TranslatorStartupTimeout = TimeSpan.FromSeconds(180);

    private readonly PythonTranslatorService _translator = new();
    private readonly CancellationTokenSource _lifetime = new();

    private bool _webViewReady;
    private bool _translatorReady;
    private bool _starting;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        Closed += OnClosed;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoaded;
        await StartAsync();
    }

    private async Task StartAsync()
    {
        if (_starting)
        {
            return;
        }

        _starting = true;
        _translatorReady = false;
        RetryButton.Visibility = Visibility.Collapsed;
        ShowStatus("Запуск EasyDTO…", "Подготовка интерфейса.");

        try
        {
            var repositoryRoot = AppPaths.FindRepositoryRoot();
            if (repositoryRoot is null)
            {
                throw new InvalidOperationException(
                    "Не удалось найти корень проекта EasyDTO. Ожидались каталоги app и ai-translator " +
                    "рядом с приложением (или задайте EASYDTO_REPO_ROOT).");
            }

            var distDirectory = Path.Combine(repositoryRoot, "app", "dist");
            var translatorDirectory = Path.Combine(repositoryRoot, "ai-translator");

            if (!File.Exists(Path.Combine(distDirectory, "index.html")))
            {
                throw new InvalidOperationException(
                    $"Не найден интерфейс: {Path.Combine(distDirectory, "index.html")}. " +
                    "Соберите его: cd app; npm install; npm run build.");
            }

            if (!File.Exists(Path.Combine(translatorDirectory, "app.py")))
            {
                throw new InvalidOperationException(
                    $"Не найден переводчик: {Path.Combine(translatorDirectory, "app.py")}.");
            }

            if (!_webViewReady)
            {
                ShowStatus("Запуск EasyDTO…", "Загрузка интерфейса.");
                await InitializeWebViewAsync(distDirectory);
            }

            ShowStatus("Запуск переводчика…", "Проверка сервиса на 127.0.0.1:5000.");
            var progress = new Progress<string>(UpdateStatusDetail);
            await _translator.EnsureStartedAsync(
                translatorDirectory,
                AllowedOrigin,
                TranslatorStartupTimeout,
                progress,
                _lifetime.Token);

            _translatorReady = true;
            HideStatus();
        }
        catch (OperationCanceledException)
        {
            // Приложение закрывается — завершение обрабатывается в OnClosed.
        }
        catch (Exception exception)
        {
            ShowError(exception);
        }
        finally
        {
            _starting = false;
        }
    }

    private async Task InitializeWebViewAsync(string distDirectory)
    {
        Directory.CreateDirectory(AppPaths.WebViewUserDataFolder);

        CoreWebView2Environment environment;
        try
        {
            environment = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: AppPaths.WebViewUserDataFolder);
        }
        catch (WebView2RuntimeNotFoundException exception)
        {
            throw new InvalidOperationException(
                "Не установлен Microsoft Edge WebView2 Runtime. " +
                "Установите его и запустите EasyDTO снова.",
                exception);
        }

        await WebView.EnsureCoreWebView2Async(environment);

        var core = WebView.CoreWebView2;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.AreDefaultContextMenusEnabled = false;
        core.Settings.IsZoomControlEnabled = false;

        core.SetVirtualHostNameToFolderMapping(
            VirtualHostName,
            distDirectory,
            CoreWebView2HostResourceAccessKind.Deny);

        var navigationCompleted = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        CoreWebView2WebErrorStatus navigationError = CoreWebView2WebErrorStatus.Unknown;

        void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs args)
        {
            core.NavigationCompleted -= OnNavigationCompleted;
            navigationError = args.WebErrorStatus;
            navigationCompleted.TrySetResult(args.IsSuccess);
        }

        core.NavigationCompleted += OnNavigationCompleted;
        core.NewWindowRequested += (_, args) => args.Handled = true;

        WebView.Source = new Uri(StartUrl);

        var success = await navigationCompleted.Task.WaitAsync(WebViewNavigationTimeout, _lifetime.Token);
        if (!success)
        {
            throw new InvalidOperationException(
                $"WebView2 не смог загрузить {StartUrl}. Код ошибки: {navigationError}.");
        }

        _webViewReady = true;
    }

    private void UpdateStatusDetail(string message)
    {
        if (StatusOverlay.Visibility == Visibility.Visible &&
            RetryButton.Visibility != Visibility.Visible)
        {
            StatusDetail.Text = message;
        }
    }

    private void ShowStatus(string title, string detail)
    {
        StatusTitle.Text = title;
        StatusDetail.Text = detail;
        StartupProgress.Visibility = Visibility.Visible;
        RetryButton.Visibility = Visibility.Collapsed;
        StatusOverlay.Visibility = Visibility.Visible;
    }

    private void ShowError(Exception exception)
    {
        StatusTitle.Text = "Не удалось запустить EasyDTO";
        StatusDetail.Text = exception.Message;
        StartupProgress.Visibility = Visibility.Collapsed;
        RetryButton.Visibility = Visibility.Visible;
        StatusOverlay.Visibility = Visibility.Visible;
    }

    private void HideStatus()
    {
        if (_webViewReady && _translatorReady)
        {
            StatusOverlay.Visibility = Visibility.Collapsed;
        }
    }

    private async void OnRetryClick(object sender, RoutedEventArgs e)
    {
        if (_starting)
        {
            return;
        }

        await StartAsync();
    }

    private void OnClosed(object? sender, EventArgs e)
    {
        _lifetime.Cancel();
        _translator.Stop();
        _translator.Dispose();

        try
        {
            WebView.Dispose();
        }
        catch (InvalidOperationException)
        {
            // WebView2 мог не успеть инициализироваться — освобождать нечего.
        }
    }
}
