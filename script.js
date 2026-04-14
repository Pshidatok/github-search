(function() {
    const searchField = document.getElementById("repoSearchInput");
    const suggestionsDiv = document.getElementById("suggestionsContainer");
    const reposContainer = document.getElementById("selectedReposList");

    const storedRepoIds = new Set();

    function delayTrigger(fn, waitMs) {
      let timerId;
      return function(...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => fn.apply(this, args), waitMs);
      };
    }

    async function loadRepositoriesFromGitHub(searchQuery) {
      const response = await fetch(`https://api.github.com/search/repositories?q=${searchQuery}`);
      if (!response.ok) {
        throw new Error("Проблема с запросом");
      }
      const jsonData = await response.json();
      return jsonData.items.slice(0, 5);
    }

    function displaySuggestions(repositories) {
      suggestionsDiv.innerHTML = "";

      if (repositories.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.classList.add("autocomplete-item");
        emptyMsg.textContent = "Нет результатов";
        suggestionsDiv.appendChild(emptyMsg);
        return;
      }

      repositories.forEach(repoItem => {
        const suggestionElement = document.createElement("div");
        suggestionElement.classList.add("autocomplete-item");
        suggestionElement.textContent = repoItem.name;

        suggestionElement.addEventListener("click", () => {
          attachRepository(repoItem);
          searchField.value = "";
          suggestionsDiv.innerHTML = "";
        });

        suggestionsDiv.appendChild(suggestionElement);
      });
    }

    function attachRepository(repoData) {
      if (storedRepoIds.has(repoData.id)) return;

      storedRepoIds.add(repoData.id);

      const card = document.createElement("div");
      card.classList.add("repo");

      const cardContent = document.createElement("div");
      cardContent.innerHTML = `
        Name: ${repoData.name}<br>
        Owner: ${repoData.owner.login}<br>
        Stars: ${repoData.stargazers_count}
      `;

      const removeButton = document.createElement("div");
      removeButton.classList.add("delete-btn");
      removeButton.textContent = "×";

      removeButton.addEventListener("click", () => {
        storedRepoIds.delete(repoData.id);
        card.remove();
      });

      card.appendChild(cardContent);
      card.appendChild(removeButton);

      reposContainer.appendChild(card);
    }

    const onUserInput = delayTrigger(async (event) => {
      const rawValue = event.target.value.trim();

      if (!rawValue) {
        suggestionsDiv.innerHTML = "";
        return;
      }

      try {
        const foundRepos = await loadRepositoriesFromGitHub(rawValue);
        displaySuggestions(foundRepos);
      } catch (err) {
        suggestionsDiv.innerHTML = "Ошибка загрузки";
      }
    }, 420);

    searchField.addEventListener("input", onUserInput);

    document.addEventListener("click", (clickEvent) => {
      if (!clickEvent.target.closest(".wrapper")) {
        suggestionsDiv.innerHTML = "";
      }
    });
  })();