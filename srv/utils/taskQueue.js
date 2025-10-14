require("module-alias/register");
const Task = require("@models/task.model");

const AddTask = async (taskUser, taskData) => {
  try {
    const task = {
      task_time: new Date(),
      task_user: taskUser,
      task_data: taskData,
      task_status: 0,
    };
    await Task.create(task);
    return {
      state: 0,
      message: "Succeeded to create the task.",
    };
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

const GetTask = async (taskUser) => {
  try {
    const tasks = await Task.findAll({
      where: { task_user: taskUser, task_status: 0 },
      attributes: ["id", "task_time", "task_user", "task_data", "task_status"],
      order: [["task_time", "ASC"]],
    });
    if (tasks.length) {
      return tasks.sort(function (a, b) {
        return a.task_time.getTime() - b.task_time.getTime();
      })[0];
    } else return null;
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

const UpdateTask = async (taskUser, taskId, taskStatus) => {
  try {
    const task = await Task.findOne({
      where: { task_user: taskUser, id: taskId },
    });

    task.task_status = taskStatus;
    task.save();

    return {
      state: 0,
      message: "Succeeded to update the task.",
    };
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

const RemoveTask = async (taskUser) => {
  try {
    await Task.destroy({
      where: { task_user: taskUser },
    });

    return {
      state: 0,
      message: "Succeeded to clear a user's tasks.",
    };
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

const ExpireTask = async () => {
  const expiryDuration = 24;
  try {
    await Task.destroy({
      where: {
        task_time: {
          [Op.lte]: moment().subtract(expiryDuration, "hours").toDate(),
        },
      },
    });

    return {
      state: 0,
      message: "Succeeded to expire the old tasks.",
    };
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

const ClearTasks = async () => {
  try {
    await Task.truncate();
    return {
      state: 0,
      message: "Succeeded to truncate all tasks.",
    };
  } catch (err) {
    return {
      state: -1,
      message: JSON.stringify(err),
    };
  }
};

module.exports = {
  AddTask,
  GetTask,
  UpdateTask,
  RemoveTask,
  ExpireTask,
  ClearTasks,
};
