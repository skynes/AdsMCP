document.getElementById("year").textContent = new Date().getFullYear();

const copyButton = document.querySelector("[data-copy]");
if (copyButton) {
  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(copyButton.dataset.copy || "");
    const original = copyButton.textContent;
    copyButton.textContent = "Copied";
    setTimeout(() => { copyButton.textContent = original; }, 1400);
  });
}
