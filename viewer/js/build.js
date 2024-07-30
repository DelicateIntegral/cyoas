(async function () {
  // constants
  const dbName = "buildsDB";
  const storeName = "cyoaBuilds";
  const savedBuilds = [];
  let db;

  // Unified function for handling IndexedDB storage operations
  function handleStorage(action, key, data, callback) {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    switch (action) {
      case "store":
        const putRequest = store.put({ name: key, data });
        putRequest.onerror = (event) => {
          console.error("Error storing in IndexedDB", event);
        };
        break;
      case "retrieve":
        const getRequest = store.get(key);
        getRequest.onsuccess = (event) => {
          callback(event.target.result ? event.target.result.data : null);
        };
        getRequest.onerror = (event) => {
          console.error("Error retrieving from IndexedDB", event);
          callback(null);
        };
        break;
      case "remove":
        const deleteRequest = store.delete(key);
        deleteRequest.onerror = (event) => {
          console.error("Error removing from IndexedDB", event);
        };
        break;
    }
  }

  // handle toast notifications
  function toggleToast(action, toastContent) {
    toast.classList.toggle("d-none");
    switch (action) {
      case "save":
        toast.innerHTML = `<span>${toastContent}</span>`;
        break;
      case "delete":
        toast.innerHTML = `<span>${toastContent}</span>`;
        break;
      case "load":
        toast.innerHTML = `<span>${toastContent}</span>`;
        break;
    }
    setTimeout(() => toast.classList.toggle("d-none"), 3000);
  }

  // Function to save the build
  function saveBuild(savedBuilds) {
    const buildName = buildNameInput.value.trim();

    if (!buildName) {
      alert("Please enter a build name.");
      return;
    }

    if (savedBuilds.some((build) => build.name === buildName)) {
      alert("This build name already exists. Please use a different name.");
      return;
    }

    const newBuild = { name: buildName };
    savedBuilds.push(newBuild);
    updateSavedBuildsUI(savedBuilds);
    buildNameInput.value = "";

    const app = document.getElementById("app");
    const activated = app.__vue__.$store.state.app.activated;
    handleStorage("store", buildName, activated);
    content = `Saved build: ${buildName}, into storage: IndexedDB`;
    console.log(content);
    toggleToast("save", content);
  }

  // Function to load a build
  function loadBuild(buildName) {
    handleStorage("retrieve", buildName, "", (data) => {
      if (data) {
        content = `Loaded build: ${buildName}, from storage: IndexedDB. Copied to clipboard !!!`;
        navigator.clipboard.writeText(data);
      } else {
        content = `No build found with name: ${buildName}, in storage: IndexedDB`;
      }
      console.log(content);
      toggleToast("load", content);
    });
  }

  // Function to delete a build
  function deleteBuild(index, savedBuilds) {
    const buildName = savedBuilds[index].name;
    handleStorage("remove", buildName);
    savedBuilds.splice(index, 1);
    updateSavedBuildsUI(savedBuilds);
    content = `Deleted build: ${buildName}, from storage: IndexedDB`;
    console.log(content);
    toggleToast("delete", content);
  }

  // Function to get all build names from IndexedDB
  function getBuildNames(savedBuilds) {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        savedBuilds.push({ name: cursor.value.name });
        cursor.continue();
      } else {
        updateSavedBuildsUI(savedBuilds);
      }
    };

    request.onerror = (event) => {
      console.error("Error retrieving builds from IndexedDB", event);
    };
  }

  // Function to update the UI with saved builds
  function updateSavedBuildsUI(savedBuilds) {
    savedBuildsList.innerHTML = ""; // Clear previous content

    savedBuilds.forEach((build, index) => {
      const listItem = document.createElement("li");
      listItem.classList.add("mb-2", "d-flex");

      // index with build names
      const buildName = document.createElement("p");
      buildName.innerText = `${index + 1}: ${build.name}`;
      listItem.appendChild(buildName);

      // Load button
      const loadButton = document.createElement("button");
      loadButton.classList.add("delicate-load-button");
      loadButton.innerHTML = `<span class="mdi mdi-content-paste"></span>`;
      loadButton.addEventListener("click", () => loadBuild(build.name));
      listItem.appendChild(loadButton);

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delicate-delete-button");
      deleteButton.innerHTML = `<span class="mdi  mdi-minus"></span>`;
      deleteButton.addEventListener("click", () =>
        deleteBuild(index, savedBuilds)
      );
      listItem.appendChild(deleteButton);

      savedBuildsList.appendChild(listItem);
    });

    setSavedListDisplay(savedBuilds);
  }

  function setSavedListDisplay(listName) {
    listName.length === 0
      ? savedBuildsTitle.classList.add("d-none")
      : savedBuildsTitle.classList.remove("d-none");
  }

  function openIDB() {
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
      console.error("Error opening IndexedDB", event);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("Connected to IndexedDB");
      getBuildNames(savedBuilds);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      console.log("Upgrade needed...");

      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "name" });
        console.log(`Object store ${storeName} created`);
      }
    };
  }

  // ----------------------------------------------------- UI Section---------------------------------------------------
  // create build element
  const buildsDiv = document.createElement("div");
  buildsDiv.classList.add("delicate-builds");
  buildsDiv.setAttribute("data-theme", "light");

  // Style the buildsDiv with Bootstrap classes
  buildsDiv.classList.add("position-fixed", "top-0", "start-0", "m-0");

  // Create button element to toggle sidebar
  const toggleButton = document.createElement("button");
  toggleButton.innerHTML = `<span class="mdi mdi-wrench"></span>`;
  toggleButton.classList.add("btn", "half-pill", "delicate-toggle-button");

  // Create sidebar to show sidebar
  const sidebar = document.createElement("div");
  sidebar.classList.add("d-none", "delicate-sidebar");

  //
  const topButtonContainer = document.createElement("div");
  topButtonContainer.classList.add(
    "d-flex",
    "mb-2",
    "delicate-topButton-container"
  );

  // Create a back button to close the sidebar
  const backButton = document.createElement("button");
  backButton.innerHTML = `<span class="mdi mdi-keyboard-backspace"></span>`;
  backButton.classList.add("delicate-back-button", "btn");

  // Create button to change theme of the buttons and sidebar
  const themeButton = document.createElement("button");
  themeButton.innerHTML = `<span class="mdi mdi-brightness-4"></span>`;
  themeButton.classList.add("delicate-theme-button", "btn");

  topButtonContainer.appendChild(themeButton);
  topButtonContainer.appendChild(backButton);

  // create element for toast
  const toast = document.createElement("div");
  toast.classList.add("delicate-toast", "d-none");

  // Create section for Build Options
  const buildSection = document.createElement("div");
  buildSection.classList.add("delicate-build-section");
  const buildTitle = document.createElement("h5");
  buildTitle.classList.add("delicate-build-title");
  buildTitle.innerText = "Save Your Build";

  const inputButtonContainer = document.createElement("div");
  inputButtonContainer.classList.add(
    "d-flex",
    "mb-2",
    "delicate-input-container"
  );

  const buildNameInput = document.createElement("input");
  buildNameInput.setAttribute("type", "text");
  buildNameInput.setAttribute("placeholder", "max 12 chars");
  buildNameInput.setAttribute("maxlength", "12");
  buildNameInput.classList.add("form-control", "delicate-build-input");

  const saveBuildButton = document.createElement("button");
  saveBuildButton.classList.add("delicate-save-button");
  saveBuildButton.innerHTML = `<span class="mdi mdi-plus"></span>`;

  inputButtonContainer.appendChild(buildNameInput);
  inputButtonContainer.appendChild(saveBuildButton);

  const savedBuildsTitle = document.createElement("h5");
  savedBuildsTitle.classList.add("delicate-save-title");
  savedBuildsTitle.innerText = "List of Saved Builds";
  const savedBuildsList = document.createElement("ol");
  savedBuildsList.classList.add("delicate-save-list");

  // adding to build section
  buildSection.appendChild(buildTitle);
  buildSection.appendChild(inputButtonContainer);
  buildSection.appendChild(savedBuildsTitle);
  buildSection.appendChild(savedBuildsList);

  // Add to sidebar
  sidebar.appendChild(topButtonContainer);
  sidebar.appendChild(buildSection);
  sidebar.appendChild(toast);

  // Add sidebar to the builds div
  buildsDiv.appendChild(toggleButton);
  buildsDiv.appendChild(sidebar);

  // Event listener to toggle the display of sidebar
  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("d-none");
    toggleButton.classList.toggle("d-none");
  });

  backButton.addEventListener("click", () => {
    sidebar.classList.add("d-none");
    toggleButton.classList.remove("d-none");
  });

  themeButton.addEventListener("click", () =>
    buildsDiv.getAttribute("data-theme") === "light"
      ? buildsDiv.setAttribute("data-theme", "dark")
      : buildsDiv.setAttribute("data-theme", "light")
  );

  // Attach event listener to the save button and build input
  saveBuildButton.addEventListener("click", () => saveBuild(savedBuilds));
  buildNameInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveBuild(savedBuilds);
    }
});

  // initialize everything
  document.body.prepend(buildsDiv);
  openIDB();
})();
