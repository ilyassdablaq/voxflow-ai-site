(function () {
  var currentScript = document.currentScript;
  if (!currentScript) {
    return;
  }

  var embedKey = currentScript.getAttribute("data-embed-key");
  if (!embedKey) {
    return;
  }

  var apiBase = currentScript.getAttribute("data-api-base") || window.location.origin;
  var theme = currentScript.getAttribute("data-theme") || "#5A67D8";
  var position = currentScript.getAttribute("data-position") || "bottom-right";
  var language = currentScript.getAttribute("data-language") || "en";
  var botName = currentScript.getAttribute("data-bot-name") || "Assistant";

  var root = document.createElement("div");
  root.style.position = "fixed";
  root.style.zIndex = "999999";
  root.style.bottom = "20px";
  root.style[position === "bottom-left" ? "left" : "right"] = "20px";
  root.style.fontFamily = "Inter, Arial, sans-serif";
  document.body.appendChild(root);

  var button = document.createElement("button");
  button.innerText = "Chat";
  button.style.width = "56px";
  button.style.height = "56px";
  button.style.borderRadius = "9999px";
  button.style.border = "none";
  button.style.cursor = "pointer";
  button.style.background = theme;
  button.style.color = "#fff";
  button.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";

  var panel = document.createElement("div");
  panel.style.display = "none";
  panel.style.width = "340px";
  panel.style.height = "460px";
  panel.style.background = "#fff";
  panel.style.border = "1px solid #e5e7eb";
  panel.style.borderRadius = "14px";
  panel.style.boxShadow = "0 25px 40px rgba(0,0,0,0.22)";
  panel.style.overflow = "hidden";
  panel.style.marginBottom = "10px";

  var header = document.createElement("div");
  header.style.background = theme;
  header.style.color = "#fff";
  header.style.padding = "12px";
  header.style.fontWeight = "600";
  header.innerText = botName;

  var messages = document.createElement("div");
  messages.style.height = "330px";
  messages.style.overflowY = "auto";
  messages.style.padding = "12px";
  messages.style.background = "#f8fafc";

  var form = document.createElement("form");
  form.style.display = "flex";
  form.style.gap = "8px";
  form.style.padding = "10px";
  form.style.borderTop = "1px solid #e5e7eb";

  var input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your message...";
  input.style.flex = "1";
  input.style.border = "1px solid #d1d5db";
  input.style.borderRadius = "8px";
  input.style.padding = "8px 10px";

  var send = document.createElement("button");
  send.type = "submit";
  send.innerText = "Send";
  send.style.border = "none";
  send.style.borderRadius = "8px";
  send.style.padding = "8px 12px";
  send.style.cursor = "pointer";
  send.style.background = theme;
  send.style.color = "#fff";

  form.appendChild(input);
  form.appendChild(send);
  panel.appendChild(header);
  panel.appendChild(messages);
  panel.appendChild(form);
  root.appendChild(panel);
  root.appendChild(button);

  var conversationId = null;

  function appendMessage(role, text) {
    var wrapper = document.createElement("div");
    wrapper.style.marginBottom = "10px";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = role === "USER" ? "flex-end" : "flex-start";

    var bubble = document.createElement("div");
    bubble.innerText = text;
    bubble.style.maxWidth = "80%";
    bubble.style.padding = "9px 12px";
    bubble.style.borderRadius = "10px";
    bubble.style.fontSize = "13px";
    bubble.style.lineHeight = "1.4";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.style.background = role === "USER" ? theme : "#e5e7eb";
    bubble.style.color = role === "USER" ? "#fff" : "#0f172a";

    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage(text) {
    appendMessage("USER", text);
    try {
      var response = await fetch(apiBase + "/api/embed/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embedKey: embedKey,
          message: text,
          conversationId: conversationId,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      var payload = await response.json();
      conversationId = payload.conversationId;
      appendMessage("ASSISTANT", payload.message && payload.message.content ? payload.message.content : "No response");
    } catch (error) {
      appendMessage("ASSISTANT", "Sorry, I couldn't reply right now. Please try again.");
    }
  }

  button.addEventListener("click", function () {
    var open = panel.style.display === "block";
    panel.style.display = open ? "none" : "block";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value.trim();
    if (!value) {
      return;
    }
    input.value = "";
    sendMessage(value);
  });
})();
