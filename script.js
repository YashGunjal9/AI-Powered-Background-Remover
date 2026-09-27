document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const selectButton = document.getElementById("selectButton");
  const originalImage = document.getElementById("originalImage");
  const processedImage = document.getElementById("processedImage");
  const removeBackgroundBtn = document.getElementById("removeBackground");
  const downloadBtn = document.getElementById("download");
  const loading = document.querySelector(".loading");

  const API_URL = "https://api.slazzer.com/v2.0/remove_image_background";

  /*
    IMPORTANT:
    Do NOT put your real Slazzer API key in frontend JavaScript.

    For testing only, you can temporarily place your key here.
    For a real website, use a backend/server.
  */
  const API_KEY = "YOUR_SLAZZER_API_KEY";

  loading.style.display = "none";

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();

    dropZone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    handleImageUpload(file);
  });

  selectButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    handleImageUpload(file);
  });

  function handleImageUpload(file) {
    const reader = new FileReader();

    reader.onload = (event) => {
      originalImage.src = event.target.result;

      originalImage.hidden = false;
      processedImage.hidden = true;

      removeBackgroundBtn.disabled = false;
      downloadBtn.disabled = true;

      processedImage.removeAttribute("src");
    };

    reader.onerror = () => {
      alert("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  }

  removeBackgroundBtn.addEventListener("click", async () => {
    if (!originalImage.src) {
      alert("Please select an image first.");
      return;
    }

    loading.style.display = "flex";
    removeBackgroundBtn.disabled = true;

    try {
      const response = await fetch(originalImage.src);

      if (!response.ok) {
        throw new Error("Unable to read the selected image.");
      }

      const imageBlob = await response.blob();

      const formData = new FormData();

      formData.append("source_image_file", imageBlob, "image.jpg");

      const apiResponse = await fetch(API_URL, {
        method: "POST",

        headers: {
          "API-KEY": API_KEY,
        },

        body: formData,
      });

      if (!apiResponse.ok) {
        let errorMessage = "";

        try {
          const errorText = await apiResponse.text();

          errorMessage = errorText;
        } catch {
          errorMessage = "";
        }

        if (apiResponse.status === 402) {
          throw new Error(
            "Slazzer returned HTTP 402. Check your Slazzer API credits, subscription, or account billing status.",
          );
        }

        if (apiResponse.status === 401) {
          throw new Error("Invalid Slazzer API key.");
        }

        if (apiResponse.status === 403) {
          throw new Error(
            "Slazzer rejected the request. Check your API permissions.",
          );
        }

        if (apiResponse.status === 429) {
          throw new Error(
            "Slazzer API rate limit exceeded. Please try again later.",
          );
        }

        throw new Error(
          `Slazzer API error (${apiResponse.status}). ${errorMessage}`,
        );
      }

      const resultBlob = await apiResponse.blob();

      if (!resultBlob.type.startsWith("image/")) {
        throw new Error("The API did not return an image.");
      }

      const resultURL = URL.createObjectURL(resultBlob);

      processedImage.src = resultURL;
      processedImage.hidden = false;

      downloadBtn.disabled = false;
    } catch (error) {
      console.error("Background removal error:", error);

      alert(error.message);
    } finally {
      loading.style.display = "none";
      removeBackgroundBtn.disabled = false;
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!processedImage.src) {
      return;
    }

    const link = document.createElement("a");

    link.href = processedImage.src;
    link.download = "processed_image.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
