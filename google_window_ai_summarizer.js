function getSelectedText() {
  return window.getSelection().toString();
}

async function handleSelection() {
  const selectedText = getSelectedText();
  if (selectedText) {
    const canCreate = await window.ai.canCreateTextSession();
    console.log("Summarizing Data...");
    if (canCreate !== "no") {
      try {
        const session = await window.ai.createTextSession();
        const result = await session.prompt(
          "Summarize the following text in bullet points: " + selectedText,
        );

        console.log(result);
      } catch (error) {
        console.error("Error creating session or prompting:", error);
      }
    }
  }
}

document.addEventListener("mouseup", handleSelection);
