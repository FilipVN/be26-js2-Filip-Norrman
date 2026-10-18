import { onValue, push, ref, remove, update } from "firebase/database";
import type { Database } from "firebase/database";
import { Member, Task } from "./models";
import type { Category } from "./types";

export class ScrumDatabase {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  listenToMembers(onChange: (members: Member[]) => void, onError: (error: Error) => void) {
    onValue(
      ref(this.db, "members"),
      (snapshot) => {
        const members: Member[] = [];
        snapshot.forEach((child) => {
          members.push(new Member(child.key, child.val()));
        });
        onChange(members);
      },
      onError,
    );
  }

  listenToTasks(onChange: (tasks: Task[]) => void, onError: (error: Error) => void) {
    onValue(
      ref(this.db, "tasks"),
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((child) => {
          tasks.push(new Task(child.key, child.val()));
        });
        onChange(tasks);
      },
      onError,
    );
  }

  async addMember(name: string, categories: Category[]) {
    await push(ref(this.db, "members"), { name, categories });
  }

  async addTask(title: string, description: string, category: Category, deadline: string) {
    await push(ref(this.db, "tasks"), { title, description, category, deadline, status: "ny" });
  }

  async assignTask(taskId: string, memberId: string) {
    await update(ref(this.db, "tasks/" + taskId), { assignedTo: memberId, status: "pågående" });
  }

  async completeTask(taskId: string) {
    const today = new Date().toLocaleDateString("sv-SE");
    await update(ref(this.db, "tasks/" + taskId), { status: "slutförd", completedAt: today });
  }

  async deleteTask(taskId: string) {
    await remove(ref(this.db, "tasks/" + taskId));
  }
}
