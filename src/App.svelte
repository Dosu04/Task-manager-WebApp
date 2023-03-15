<script>
	let todos = []
	let task = "";
		let filter='all';
		function addTask(){
			todos = [{
				task:task,
				status:"pending"
			}, ...todos];
			task = "";
		}
		function markComplete(i){
			todos[i].status = "completed";
			todos = [...todos];
		}
		function removeTask(i){
			todos.splice(i,1);
			todos = [...todos];
		}
	</script>
	
	<style>
		.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 50px;
	}
	
	.todo {
		width: 500px;
		border: 2px solid black;
		border-radius: 5px;
		padding: 20px;
	}
	
	.form {
		display: flex;
		align-items: center;
		margin-bottom: 20px;
	}
	
	input[type="text"] {
		flex-grow: 1;
		padding: 5px;
		font-size: 16px;
		border: none;
		border-bottom: 1px solid black;
		margin-right: 10px;
	}
	
	button {
		background-color: #4CAF50;
		color: white;
		border: none;
		border-radius: 5px;
		padding: 5px 10px;
		cursor: pointer;
	}
	
	.tasks {
		display: flex;
		flex-direction: column;
	}
	
	.task {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
	}
	
	.task div {
		flex-grow: 1;
		font-size: 16px;
	}
	
	.task button {
		margin-left: 10px;
		font-size: 16px;
	}
	
	.task button.active {
		background-color: #008CBA;
	}
	
	.filters {
		display: flex;
		justify-content: center;
		margin-top: 20px;
	}
	
	.filters button {
		background-color: #f2f2f2;
		color: black;
		border: none;
		border-radius: 5px;
		padding: 5px 10px;
		cursor: pointer;
		margin-right: 10px;
	}
	
	.filters button.active {
		background-color: #4CAF50;
		color: white;
	}
	header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 30px;
	}

	h1 {
		font-size: 36px;
		margin: 0;
	}

	h4 {
		font-size: 16px;
		font-weight: normal;
		margin: 0;
		color: #999;
	}
	footer {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		padding: 10px 0;
		background-color: #f5f5f5;
		bottom: 0;
		left: 0;
		width: 100%;
		position: fixed;
	}

	a {
		color: orangered;
		text-decoration: none;
	}

	a:hover {
		color: rgb(255, 0, 0);

		text-decoration: none;
	}

	img {
		width: 25px;
		margin: 0 5px;
	}
	</style>
	<header><h1>Dosu - Tasks</h1> <h4>Task Manager / Productivity Web App</h4></header>
	<div class="container">
		<div class="todo">
			<div class="form">
				<input type="text" bind:value={task}/>
				<button on:click={addTask}>
					Add
				</button>
			</div>
			<div class="tasks">
				{#each todos as todo, i}
					{#if filter=='all'}
						<div class="task">
							<div>
								{todo.task}
							</div>
							<button class="{todo.status=='completed'?'active':''}" on:click={()=>{markComplete(i)}}>
								&#10004;
							</button>
							<button on:click={()=>{removeTask(i)}}>
								&#10006;
							</button>
						</div>
					{:else if filter=='completed'}
						{#if todo.status=='completed'}
							<div class="task">
								<div>
									{todo.task}
								</div>
								<button on:click={()=>{removeTask(i)}}>
									&#10006;
								</button>
							</div>
						{/if}
					{:else}
						{#if todo.status=='pending'}
							<div class="task">
								<div>
									{todo.task}
								</div>
								<button class="{todo.status=='completed'?'active':''}" on:click={()=>{markComplete(i)}}>
									&#10004;
								</button>
							</div>
						{/if}
					{/if}
				{/each}
			</div>
			<div class="filters">
				<button class="{filter=='all'?'active':''}" on:click={()=>{filter='all'}}>
					All
				</button>
				<button class="{filter=='completed'?'active':''}" on:click={()=>{filter='completed'}}>
					Completed
				</button>
				<button class="{filter=='incomplete'?'active':''}" on:click={()=>{filter='incomplete'}}>
					Incomplete
				</button>
			</div>
		</div>
	</div>
	<footer>
		<p>
		Made with <a href=""> Svelte.js</a>  <img src="https://th.bing.com/th/id/R.02f9ec2d33cc2727b182b07e53a35773?rik=sB8nh4ElbxLn7g&pid=ImgRaw&r=0" alt=""> by <a href=""> Emmanuel Oladosu</a> 

		</p>
	</footer>