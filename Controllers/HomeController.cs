using Microsoft.AspNetCore.Mvc;

namespace PhotoStudio.Controllers;

public class HomeController : Controller
{
    public IActionResult Index() => View();
}
