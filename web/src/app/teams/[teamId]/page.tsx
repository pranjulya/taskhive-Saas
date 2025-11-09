"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getTeam,
  getTasksForTeam,
  createTask,
  updateTask,
  deleteTask,
} from "../../../lib/api";
import styles from "./Kanban.module.css";
import TaskModal from "./TaskModal";

export default function TeamPage() {
  const params = useParams();
  const { teamId } = params;
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view this page.");
      return;
    }

    try {
      const teamData = await getTeam(teamId, token);
      if (teamData._id) {
        setTeam(teamData);
      } else {
        setError(teamData.message || "Failed to fetch team details.");
      }

      const tasksData = await getTasksForTeam(teamId, token);
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      } else {
        setError(tasksData.message || "Failed to fetch tasks.");
      }
    } catch (err) {
      setError("An error occurred while fetching data.");
    }
  };

  const handleOpenModal = (task = null) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleSaveTask = async (taskData) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (taskData._id) {
        await updateTask(taskData._id, taskData, token);
      } else {
        await createTask(teamId, taskData, token);
      }
      fetchData(); // Refetch data to show the changes
      handleCloseModal();
    } catch (err) {
      setError("Failed to save task.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await deleteTask(taskId, token);
      fetchData(); // Refetch data to show the changes
    } catch (err) {
      setError("Failed to delete task.");
    }
  };

  const renderTasks = (status) => {
    return tasks
      .filter((task) => task.status === status)
      .map((task) => (
        <div key={task._id} className={styles.taskCard}>
          <h5>{task.title}</h5>
          <p>{task.description}</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenModal(task)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-sm ms-2"
            onClick={() => handleDeleteTask(task._id)}
          >
            Delete
          </button>
        </div>
      ));
  };

  return (
    <div className="container">
      {error && <div className="alert alert-danger">{error}</div>}
      {team ? (
        <div>
          <h1>{team.name}</h1>
          <div className={`mt-4 ${styles.kanbanBoard}`}>
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>To Do</h4>
              {renderTasks("todo")}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => handleOpenModal()}
              >
                + Add Task
              </button>
            </div>
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>In Progress</h4>
              {renderTasks("doing")}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={() => handleOpenModal()}
              >
                + Add Task
              </button>
            </div>
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>Done</h4>
              {renderTasks("done")}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading team details...</p>
      )}

      {showModal && (
        <TaskModal
          task={selectedTask}
          onSave={handleSaveTask}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
