import React, { useEffect, useReducer,useState } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import {listTodos} from './graphql/queries'
import { createTodo  as CreateTodo} from './graphql/mutations'
import {Auth} from 'aws-amplify'


// import uuid to create a unique client ID
import uuid from 'uuid/v4'
import Amplify from "aws-amplify";

import config from './aws-exports'
import {onCreateTodo} from "./graphql/subscriptions";
import {S3ImageUpload} from "./S3ImageUpload";
import {S3imageView} from "./S3imageView";
Amplify.configure(config);

const CLIENT_ID = uuid()

// create initial state
const initialState = {
    name: '', price: '', symbol: '', todos: []
}

// create reducer to update state
function reducer(state, action) {
    switch(action.type) {
        case 'SETTODOS':
            return { ...state, todos: action.todos }
        case 'SETINPUT':
            return { ...state, [action.key]: action.value }
        // new 👇
        case 'ADDTODO':
            return { ...state, todos: [...state.todos, action.todo] }
        default:
            return state
    }
}

function App() {
    const [state, dispatch] = useReducer(reducer, initialState)
    const [username, setUsername] = useState('')

    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        Auth.currentAuthenticatedUser().then(user => setUsername(user))
            .catch(err => console.log({err}))
    }, [])

    useEffect(() => {
        const subscription = API.graphql(graphqlOperation(onCreateTodo)).subscribe({
            next: (eventData) => {
                const todo = eventData.value.data.onCreateTodo
                if (todo.id === CLIENT_ID) return
                dispatch({ type: 'ADDTODO', todo  })
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    async function getData() {
        try {
            const todoData = await API.graphql(graphqlOperation(listTodos))
            console.log('data from API: ', todoData)
            dispatch({ type: 'SETTODOS', todos: todoData.data.listTodos.items})
        } catch (err) {
            console.log('error fetching data..', err)
        }
    }

    async function createTodo() {
        const { name, description } = state
        if (name === '' || description === '') return
        const todo = {
            name, description: description ,id: CLIENT_ID
        }
        const todos = [...state.todos, todo]
        dispatch({ type: 'SETTODOS', todos })
        console.log('todo:', todo)

        try {
            await API.graphql(graphqlOperation(CreateTodo, { input: todo }))
            console.log('item created!')
        } catch (err) {
            console.log('error creating todo...', err)
        }
    }

    // change state then user types into input
    function onChange(e) {
        dispatch({ type: 'SETINPUT', key: e.target.name, value: e.target.value })
    }

    // add UI with event handlers to manage user input
    return (
        <div>

            <S3ImageUpload/>
            Image
            <S3imageView/>

            <input
                name='name'
                placeholder='name'
                onChange={onChange}
                value={state.name}
            />
            <input
                name='description'
                placeholder='description'
                onChange={onChange}
                value={state.description}
            />
            <button onClick={createTodo}>Create Todo</button>
            {
                state.todos.map((c, i) => (
                    <div key={i}>
                        <h2>{c.name}</h2>
                        <p>{c.description}</p>
                    </div>
                ))
            }
        </div>
    )
}

export default withAuthenticator(App, { includeGreetings: true })
