class Task {
    constructor(id, title, uid) {
        this.id = id;
        this.title = title;
        this.priority = {};
        // this.sortKey = 0;
        this.uid = uid;
    }
}

const email = document.getElementById("email");
const password = document.getElementById("password");

function signUp() {
    firebase.auth()
        .createUserWithEmailAndPassword(email.value, password.value)
        .then(user => {
            console.log("Once a user has been created", user);
            alert("Account created!")
        })
        .catch(err => {
            alert(err);
        })
    }

function logIn() {
    firebase.auth()
    .signInWithEmailAndPassword(email.value, password.value)
    .then(user => {
        console.log("User has logged in", user);
    })
    .catch(err => {
        alert(err);
    })
}

function signOut(){
    firebase.auth().signOut();
    alert("sign out")
}

document.getElementById("taskListPage").style.display = 'none';
document.getElementById("welcomePage").style.display = 'none';

firebase.auth().onAuthStateChanged(function(user){
    if (user) {
        document.getElementById("welcomePage").style.display = 'none';
        document.getElementById("taskListPage").style.display = 'block';
    } else {
        document.getElementById("taskListPage").style.display = 'none';
        document.getElementById("welcomePage").style.display = 'block';
    }
});

class TaskListPage {
    constructor() {
        this.tasks = [];
        this.priorities = [];
        this.users = [];

        firebase.database().ref("priorities").once("value", (prioritiesSnapshot) => {
            const allPriorities = prioritiesSnapshot.val();
            Object.keys(allPriorities).forEach(priorityId => {
                const priorityData = allPriorities[priorityId];
                const priority = {
                    id: priorityId,
                    name: priorityData.name,
                    color: priorityData.color
                }
                this.priorities.push(priority);
            });

            
            
            const user = firebase.auth().currentUser;
            const userId = user.uid
            console.log(userId)

            firebase.database()
                // .orderByChild("sortKey")
                .ref("tasks")
                .once('value', (snapshot) => {
                    const allTasks = snapshot.val();
                    console.log(allTasks);

                    // takes any object and returns array of strings
                    Object.keys(allTasks).forEach(taskId => {
                        const taskData = allTasks[taskId];
                        const task = new Task(taskId, taskData.title, userId);

                        if (taskData.priorityId) {
                            console.log(taskData);
                            const priority = this.priorities.find(priority => priority.id == taskData.priorityId);
                            task.priority = priority;
                            console.log(task)
                        }

                        // if (taskData.userId) {
                        //     const usersId = this.users.find(usersId => user.uid == taskData.userId);
                        //     task.uid = usersId;
                        // }

                        this.tasks.push(task);
                        // console.log(this.tasks);


                        const taskListElement = document.getElementById("taskList");
                        const row = document.createElement("tr");
                        row.setAttribute("data-task-id", task.id);
                        row.innerHTML = `
                    <td>${task.title} <span class = "badge badge-success">${task.priority.name}</span></td>
                    <td><button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button>
                        <button data-action="delete" data-task-id="${task.id}" class="btn btn-danger">Delete</button>
                    </td>
                    `;
                        taskListElement.appendChild(row);

                        // const user = firebase.auth().currentUser;
                        // if (user != null) {
                        //     user.providerData.forEach(function (task) {
                        //         console.log("UID: " + task.uid);
                        //         console.log("email: " + task.email);
                        //     })
                        // }


                    });
                });
        });
    }

    addTask(title) {
        const db = firebase.database();

        // const sortKey = this.tasks.length + 1;

        // push() creates new identity and pushes it
        // set() depends on having an id already (more so used for updating)

        // const taskId = db.ref('tasks').push().key;
        // db.ref('tasks/' + taskId).set({
        //     title: title
        // });

        const user = firebase.auth().currentUser; 

        const newTaskSnapshot = db.ref('tasks').push({
            title: title,
            // sortKey: sortKey,
            userId: user.uid
        });

        const taskId = newTaskSnapshot.key

        const task = new Task(taskId, title, user.uid);
        this.tasks.push(task);

        const taskListElement = document.getElementById("taskList");
        const row = document.createElement("tr");
        row.setAttribute("data-task-id", task.id, task.userId);
        row.innerHTML = `
      <td>${task.title}</td>
      <td><button data-action="edit" data-task-id="${task.id}" class="btn btn-primary">Edit</button>
        <button data-action="delete" data-task-id="${task.id}" class="btn btn-danger">Delete</button>
      </td>
      `;
        taskListElement.appendChild(row);
        document.getElementById("task").value = "";

        // const url = "https://ixperience-day6-hw.firebaseio.com/tasks.json";
        // fetch(url, {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Access-Control-Allow-Origin": "*"
        //     },
        //     body: JSON.stringify(task)
        // }).then(response => {
        //     response.json().then(data => {
        //         console.log(data);
        //         const taskId = data.name;
        //     }).catch(err => console.log(err));
        // }).catch(err => console.log(err));
    }

    startEdittingTask(taskId) {
        // finding same id
        for (let k = 0; k < this.tasks.length; k++) {
            if (this.tasks[k].id == taskId) {
                const task = this.tasks[k];

                const taskInputElement = document.getElementById("task");
                taskInputElement.value = task.title;
                taskInputElement.setAttribute("data-task-id", task.id, task.userId);
                document.getElementById("addBtn").innerText = "Save";
            }
        }
    }

    saveTaskTitle(taskId, taskTitle) {

        const task = this.tasks.find((task) => task.id == taskId);
        if (!task) return;

        task.title = taskTitle;

        firebase.database().ref('tasks').child(taskId).set(task);
        //same thing as the one above
        // db.ref('tasks/' + taskId);

        const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
        if (!existingRow) return;

        existingRow.children[0].innerHTML = task.title;
        const taskInput = document.getElementById("task");
        taskInput.removeAttribute("data-task-id");
        taskInput.value = "";
        document.getElementById("addBtn").innerText = "Add";
    }

    taskDelete(taskId) {
        const task = this.tasks.find((task) => task.id == taskId);
        if (!task) return;

        firebase.database().ref('tasks').child(taskId).remove();

        const existingRow = document.querySelector(`tr[data-task-id="${task.id}"]`);
        if (!existingRow) return;
        // remove the html element
        existingRow.remove();
    }
}

const taskListPage = new TaskListPage();

document.getElementById("addBtn").addEventListener("click", (e) => {
    const taskInputElement = document.getElementById("task");
    const taskTitle = taskInputElement.value;

    const existingTaskId = taskInputElement.getAttribute("data-task-id");
    if (existingTaskId) {
        taskListPage.saveTaskTitle(existingTaskId, taskTitle);
    } else {
        taskListPage.addTask(taskTitle);
    }
});

document.getElementById("taskList").addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    if (action !== "edit") return;

    const taskId = e.target.getAttribute("data-task-id");
    taskListPage.startEdittingTask(taskId);
});

document.getElementById("taskList").addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    if (action !== "delete") return;

    const taskId = e.target.getAttribute("data-task-id");
    taskListPage.taskDelete(taskId);
})