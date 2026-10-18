import type { Category, Status } from "./types";

export interface MemberData {
  name: string;
  categories: Category[];
}

export interface TaskData {
  title: string;
  description: string;
  category: Category;
  status: Status;
  deadline: string;
  assignedTo?: string;
  completedAt?: string;
}

export class Member {
  id: string;
  name: string;
  categories: Category[];

  constructor(id: string, data: MemberData) {
    this.id = id;
    this.name = data.name;
    this.categories = data.categories;
  }
}

export class Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  deadline: string;
  assignedTo?: string;
  completedAt?: string;

  constructor(id: string, data: TaskData) {
    this.id = id;
    this.title = data.title;
    this.description = data.description;
    this.category = data.category;
    this.status = data.status;
    this.deadline = data.deadline;
    this.assignedTo = data.assignedTo;
    this.completedAt = data.completedAt;
  }

  canBeAssignedTo(member: Member) {
    return this.status === "ny" && member.categories.includes(this.category);
  }
}
