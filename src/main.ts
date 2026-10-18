import "./style.css";
import { db } from "./firebase";
import { ScrumDatabase } from "./ScrumDatabase";
import { Member, Task } from "./models";
import type { Category } from "./types";

const database = new ScrumDatabase(db);

let members: Member[] = [];
let tasks: Task[] = [];

const taskForm = document.getElementById("task-form") as HTMLFormElement;
const memberForm = document.getElementById("member-form") as HTMLFormElement;
const memberList = document.getElementById("member-list") as HTMLUListElement;
const categoryFilter = document.getElementById(
  "category-filter",
) as HTMLSelectElement;
const memberFilter = document.getElementById(
  "member-filter",
) as HTMLSelectElement;
const newColumn = document.getElementById("new-tasks") as HTMLDivElement;
const ongoingColumn = document.getElementById(
  "ongoing-tasks",
) as HTMLDivElement;
const doneColumn = document.getElementById("done-tasks") as HTMLDivElement;
const messageBox = document.getElementById("message") as HTMLParagraphElement;

function showMessage(text: string, type: string) {
  messageBox.textContent = text;
  messageBox.className = "message " + type;
  messageBox.hidden = false;
  setTimeout(() => {
    messageBox.hidden = true;
  }, 5000);
}

memberForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(memberForm);
  const name = String(formData.get("name")).trim();
  const categories = formData.getAll("category") as Category[];

  if (categories.length === 0) {
    showMessage("Du måste välja minst en kategori", "error");
    return;
  }

  try {
    await database.addMember(name, categories);
    memberForm.reset();
    showMessage("Medlemmen lades till", "success");
  } catch (error) {
    console.log(error);
    showMessage("Något gick fel, medlemmen sparades inte", "error");
  }
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(taskForm);
  const title = String(formData.get("title")).trim();
  const description = String(formData.get("description")).trim();
  const category = formData.get("category") as Category;
  const deadline = String(formData.get("deadline"));

  try {
    await database.addTask(title, description, category, deadline);
    taskForm.reset();
    showMessage("Uppgiften lades till", "success");
  } catch (error) {
    console.log(error);
    showMessage("Något gick fel, uppgiften sparades inte", "error");
  }
});

function render() {
  memberList.innerHTML = "";
  if (members.length === 0) {
    memberList.innerHTML = "<li>Inga medlemmar än.</li>";
  }
  for (let i = 0; i < members.length; i++) {
    const li = document.createElement("li");
    li.textContent =
      members[i].name + " (" + members[i].categories.join(", ") + ")";
    memberList.append(li);
  }

  const selectedMember = memberFilter.value;
  memberFilter.innerHTML = '<option value="">Alla medlemmar</option>';
  for (let i = 0; i < members.length; i++) {
    memberFilter.append(new Option(members[i].name, members[i].id));
  }
  memberFilter.value = selectedMember;

  newColumn.innerHTML = "";
  ongoingColumn.innerHTML = "";
  doneColumn.innerHTML = "";

  let filtered: Task[] = [];
  for (let i = 0; i < tasks.length; i++) {
    if (
      categoryFilter.value !== "" &&
      tasks[i].category !== categoryFilter.value
    )
      continue;
    if (memberFilter.value !== "" && tasks[i].assignedTo !== memberFilter.value)
      continue;
    filtered.push(tasks[i]);
  }
  filtered.sort((a, b) => (a.deadline > b.deadline ? 1 : -1));

  for (let i = 0; i < filtered.length; i++) {
    const task = filtered[i];

    const card = document.createElement("article");
    card.className = "card " + task.category;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = task.category;
    card.append(badge);

    const h3 = document.createElement("h3");
    h3.textContent = task.title;
    card.append(h3);

    const desc = document.createElement("p");
    desc.textContent = task.description;
    card.append(desc);

    const deadline = document.createElement("p");
    deadline.className = "info";
    deadline.textContent = "Deadline: " + task.deadline;
    card.append(deadline);

    let memberName = "Okänd medlem";
    for (let j = 0; j < members.length; j++) {
      if (members[j].id === task.assignedTo) {
        memberName = members[j].name;
      }
    }

    if (task.status === "ny") {
      const select = document.createElement("select");
      select.append(new Option("Välj medlem…", ""));
      for (let j = 0; j < members.length; j++) {
        if (task.canBeAssignedTo(members[j])) {
          select.append(new Option(members[j].name, members[j].id));
        }
      }

      if (select.options.length === 1) {
        const hint = document.createElement("p");
        hint.className = "hint";
        hint.textContent =
          "Ingen medlem har kategorin " + task.category + " än.";
        card.append(hint);
      } else {
        const assign = document.createElement("div");
        assign.className = "assign";
        const button = document.createElement("button");
        button.textContent = "Tilldela";
        button.addEventListener("click", async () => {
          if (select.value === "") {
            return;
          }
          try {
            await database.assignTask(task.id, select.value);
          } catch (error) {
            console.log(error);
            showMessage("Kunde inte tilldela uppgiften", "error");
          }
        });
        assign.append(select);
        assign.append(button);
        card.append(assign);
      }

      newColumn.append(card);
    } else if (task.status === "pågående") {
      const member = document.createElement("p");
      member.className = "info";
      member.textContent = "Medlem: " + memberName;
      card.append(member);

      const button = document.createElement("button");
      button.textContent = "Markera som slutförd";
      button.addEventListener("click", async () => {
        try {
          await database.completeTask(task.id);
        } catch (error) {
          console.log(error);
          showMessage("Kunde inte markera uppgiften som slutförd", "error");
        }
      });
      card.append(button);

      ongoingColumn.append(card);
    } else if (task.status === "slutförd") {
      const member = document.createElement("p");
      member.className = "info";
      member.textContent = "Medlem: " + memberName;
      card.append(member);

      const completed = document.createElement("p");
      completed.className = "info";
      completed.textContent = "Slutförd: " + task.completedAt;
      card.append(completed);

      const button = document.createElement("button");
      button.textContent = "Radera";
      button.className = "danger";
      button.addEventListener("click", async () => {
        if (confirm("Vill du radera uppgiften?")) {
          try {
            await database.deleteTask(task.id);
          } catch (error) {
            console.log(error);
            showMessage("Kunde inte radera uppgiften", "error");
          }
        }
      });
      card.append(button);

      doneColumn.append(card);
    }
  }

  if (newColumn.innerHTML === "")
    newColumn.innerHTML = '<p class="empty">Inga uppgifter</p>';
  if (ongoingColumn.innerHTML === "")
    ongoingColumn.innerHTML = '<p class="empty">Inga uppgifter</p>';
  if (doneColumn.innerHTML === "")
    doneColumn.innerHTML = '<p class="empty">Inga uppgifter</p>';
}

categoryFilter.addEventListener("change", render);
memberFilter.addEventListener("change", render);

database.listenToMembers(
  (newMembers) => {
    members = newMembers;
    render();
  },
  (error) => {
    console.log(error);
    showMessage("Kunde inte hämta medlemmar", "error");
  },
);

database.listenToTasks(
  (newTasks) => {
    tasks = newTasks;
    render();
  },
  (error) => {
    console.log(error);
    showMessage("Kunde inte hämta uppgifter", "error");
  },
);
