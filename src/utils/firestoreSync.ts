import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DailyStats, SessionRecord, TaskItem } from '../types';

export function subscribeToUserStats(
  userId: string,
  onStats: (stats: Partial<DailyStats>) => void
): () => void {
  const path = `users/${userId}/stats/daily`;
  const statDocRef = doc(db, 'users', userId, 'stats', 'daily');

  return onSnapshot(
    statDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onStats({
          date: data.date,
          focusMinutesToday: data.focusMinutesToday ?? 0,
          sessionsCompletedToday: data.sessionsCompletedToday ?? 0,
          streakDays: data.streakDays ?? 1,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveUserStatsToFirestore(userId: string, stats: DailyStats): Promise<void> {
  const path = `users/${userId}/stats/daily`;
  try {
    const statDocRef = doc(db, 'users', userId, 'stats', 'daily');
    await setDoc(statDocRef, {
      userId,
      date: stats.date,
      focusMinutesToday: stats.focusMinutesToday,
      sessionsCompletedToday: stats.sessionsCompletedToday,
      streakDays: stats.streakDays,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserTasks(
  userId: string,
  onTasks: (tasks: TaskItem[]) => void
): () => void {
  const path = `users/${userId}/tasks`;
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TaskItem[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        tasks.push({
          id: item.id || d.id,
          title: item.title || '',
          category: item.category || 'General',
          completed: !!item.completed,
          pomodorosSpent: item.pomodorosSpent || 0,
          targetPomodoros: item.targetPomodoros || 2,
          createdAt: item.createdAt || Date.now(),
        });
      });
      onTasks(tasks);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveTaskToFirestore(userId: string, task: TaskItem): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const taskDocRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskDocRef, {
      id: task.id,
      userId,
      title: task.title,
      category: task.category || 'Deep Work',
      completed: task.completed,
      pomodorosSpent: task.pomodorosSpent,
      targetPomodoros: task.targetPomodoros,
      createdAt: task.createdAt,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    const taskDocRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserHistory(
  userId: string,
  onHistory: (records: SessionRecord[]) => void
): () => void {
  const path = `users/${userId}/history`;
  const histRef = collection(db, 'users', userId, 'history');
  const q = query(histRef, orderBy('timestamp', 'desc'), limit(25));

  return onSnapshot(
    q,
    (snapshot) => {
      const history: SessionRecord[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        history.push({
          id: item.id || d.id,
          timestamp: item.timestamp || Date.now(),
          mode: item.mode || 'focus',
          durationMinutes: item.durationMinutes || 25,
          taskTitle: item.taskTitle,
        });
      });
      onHistory(history);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveSessionHistoryToFirestore(
  userId: string,
  record: SessionRecord
): Promise<void> {
  const path = `users/${userId}/history/${record.id}`;
  try {
    const histDocRef = doc(db, 'users', userId, 'history', record.id);
    await setDoc(histDocRef, {
      id: record.id,
      userId,
      timestamp: record.timestamp,
      mode: record.mode,
      durationMinutes: record.durationMinutes,
      ...(record.taskTitle ? { taskTitle: record.taskTitle } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
