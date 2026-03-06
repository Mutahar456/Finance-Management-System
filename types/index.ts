import { 
  User, 
  InventoryItem, 
  FinanceTransaction, 
  Project, 
  ProjectAssignment,
  ProjectDeal,
  ProjectTimeline,
  ActivityLog,
  Role,
  ProjectStatus,
  ProjectPriority,
  ProjectRole,
  DealStatus,
  TimelineEventType,
  TimelineStatus,
  ActionType,
  Module
} from '@prisma/client'

export type {
  User,
  InventoryItem,
  FinanceTransaction,
  Project,
  ProjectAssignment,
  ProjectDeal,
  ProjectTimeline,
  ActivityLog,
  Role,
  ProjectStatus,
  ProjectPriority,
  ProjectRole,
  DealStatus,
  TimelineEventType,
  TimelineStatus,
  ActionType,
  Module,
}

export interface InventoryItemWithUser extends InventoryItem {
  user: User
}

export interface FinanceTransactionWithUser extends FinanceTransaction {
  user: User
}

export interface ProjectWithDetails extends Project {
  creator: User
  assignments: (ProjectAssignment & { user: User })[]
  deals: ProjectDeal[]
  timelines: (ProjectTimeline & { assignee: User | null })[]
}

export interface ActivityLogWithUser extends ActivityLog {
  user: { id: string; name: string; email: string }
}


