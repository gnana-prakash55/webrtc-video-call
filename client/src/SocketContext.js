import React,{createContext,useState,useEffect,useRef} from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('https://video-chat-app-san.herokuapp.com/')

const ContextProvider = ({children}) => {

    const [stream,setStream] = useState(null);
    const [me,setMe] = useState('');
    const [call,setCall] = useState({});
    const [callAccepted,setCallAccepted] = useState(false);
    const [callEnded,setCallEnded] = useState(false);
    const [name,setName] = useState('');
    const [shareStream,setShareStream] = useState(null);
    const [screenShareEnded, setScreenShareEnded] = useState(false);
    const [message,setMessage] = useState('')

    const myVideo = useRef();
    const userVideo = useRef();
    const screenShareVideo = useRef();
    const connectionRef = useRef();

    //console.log(stream)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true})
            .then((currentStream) => {
                setStream(currentStream);
                myVideo.current.srcObject = currentStream;
            });

        socket.on('me',(id) => setMe(id) )

        socket.on('calluser',({ from, name: callerName, signal})=> {
            setCall({ isReceivedCall:true, from, name: callerName, signal})
        })

    },[]);

    const answerCall = () => {
        setCallAccepted(true);

        const peer = new Peer({ initiator: false, trickle: false, stream});

        peer.on('signal', (data) => {
            socket.emit('answercall', { signal: data, to: call.from })
        })

        peer.on('stream',(currentStream) => {
            userVideo.current.srcObject = currentStream;
        })

        peer.on('connect',()=> {
            peer.send(JSON.stringify({name:'admin',msg:'Wecome to video Chat'}))
        })

        peer.on('data',(data) => {
            let payload = JSON.parse(data)
            console.log(payload.name + ':' + payload.msg)
        })

        peer.signal(call.signal)

        connectionRef.current = peer;
    }

    const callUser = (id) => {

        const peer = new Peer({ initiator: true, trickle: false, stream});

        peer.on('signal', (data) => {
            socket.emit('calluser', { userToCall: id, signalData: data, from: me, name})
        })

        peer.on('stream',(currentStream) => {
            userVideo.current.srcObject = currentStream;
        })

        peer.on('connect',()=> {
            peer.send(JSON.stringify({name:'admin',msg:'Welcome to video Chat'}))
        })

        peer.on('data',(data) => {
            let payload = JSON.parse(data)
            console.log(payload.name + ':' + payload.msg)
        })

        socket.on('callaccepted',(signal) => {
            setCallAccepted(true);

            peer.signal(signal)
        })

        connectionRef.current = peer;
       

    }

    const screenShare = () => {
        navigator.mediaDevices.getDisplayMedia({cursor:true})
        .then(screenStream=>{
            setScreenShareEnded(false)
            setShareStream(screenStream)
            connectionRef.current.replaceTrack(stream.getVideoTracks()[0],screenStream.getVideoTracks()[0],stream)
            myVideo.current.srcObject=screenStream
            screenStream.getTracks()[0].onended = () =>{
            setScreenShareEnded(true)
            connectionRef.current.replaceTrack(screenStream.getVideoTracks()[0],stream.getVideoTracks()[0],stream)
            myVideo.current.srcObject=stream
          }
        })
    }

    const stopSharing = () => {
        connectionRef.current.replaceTrack(shareStream.getVideoTracks()[0],stream.getVideoTracks()[0],stream)
        myVideo.current.srcObject=stream
    }

    const leaveCall = () => {
        setCallEnded(true);

        connectionRef.current.destroy();

        window.location.reload();
    }

    const sendMessage = () => {
        console.log(message)
        connectionRef.current.send(JSON.stringify({name:name,msg:message}))
        setMessage('')
    }



    return(
        <SocketContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            callUser,
            me,
            leaveCall,
            answerCall,
            shareStream,
            screenShare,
            screenShareVideo,
            stopSharing,
            screenShareEnded,
            message,
            setMessage,
            sendMessage
        }}>

            {children}

        </SocketContext.Provider>
    )
}

export { ContextProvider, SocketContext } 