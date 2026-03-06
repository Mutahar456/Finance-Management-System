import { prisma } from '@/lib/prisma'
import { ActionType, Module } from '@prisma/client'

interface LogData {
  actionType: ActionType
  module: Module
  recordId: string
  performedBy: string
  oldValues?: any
  newValues?: any
  description?: string
}

export async function createActivityLog(data: LogData) {
  try {
    await prisma.activityLog.create({
      data: {
        actionType: data.actionType,
        module: data.module,
        recordId: data.recordId,
        performedBy: data.performedBy,
        oldValues: data.oldValues || {},
        newValues: data.newValues || {},
        description: data.description,
      },
    })
  } catch (error) {
    console.error('Error creating activity log:', error)
    // Don't throw - logging should not break the main operation
  }
}


