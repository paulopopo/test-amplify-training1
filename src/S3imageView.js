import {Storage} from 'aws-amplify'
import React, { useEffect, useReducer,useState } from 'react'

export function S3imageView ()  {
    const [imageUrl, updateImage] = useState('')

    async function fetchImage() {
        const imagePath = await Storage.get('example.png')
        updateImage(imagePath)
    }

    return (
        <div>
            <img src={imageUrl}/>
            <button onClick={fetchImage}>Fetch Image</button>
        </div>
    )
}


