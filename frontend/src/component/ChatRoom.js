import React, { useState } from "react";
import {over} from 'stompjs';
import SockJS from "sockjs-client";

var stompClient =null;
const ChatRoom = () => {
    const [publicChats, setPublicChats] = useState([]);
    const [privateChats, setPrivateChats] = useState(new Map());
    const [tab, setTab] = useState("CHATROOM");
    const [selectedChat, setSelectedChat] = useState(null);
    const privateChatNames = [...privateChats.keys()];
    const [userData, setUserData] = useState({
        username:"",
        receivername:"",
        connected:false,
        message:""
    })
    
    const handleValue = (event) =>{
        const {value,name} = event.target;
        setUserData({...userData,[name]:value});
    }

    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});
    }

    const connect =()=>{
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = ()=>{
        setUserData({...userData,"connected":true});
        stompClient.subscribe('/chatroom/public',onPublicMessageReceived);
        stompClient.subscribe('/user/'+userData.username+"/private",onPrivateMessageReceived);
        userJoin();
    }

    const userJoin = () => {
        let chatMessage={
            senderName:userData.username,
            status:'JOIN'
        };
        stompClient.send('/app/message',{},JSON.stringify(chatMessage));
    }

    const onError =(err)=>{
        console.log(err);
    }

    const onPublicMessageReceived =(payload)=>{
        let payloadData=JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
        }
    }

    const onPrivateMessageReceived =(payload)=>{
        let payloadData=JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        } else {
            let list=[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const sendPublicMessage = () => {
        if(stompClient){
            let chatMessage={
                senderName:userData.username,
                message:userData.message,
                status:'MESSAGE'
            };
            stompClient.send('/app/message',{},JSON.stringify(chatMessage));
            setUserData({...userData,"message":""});
        }
    }

    const sendPrivateMessage = () => {
        if(stompClient){
            let chatMessage={
                senderName:userData.username,
                receiverName:tab,
                message:userData.message,
                status:'MESSAGE'
            };
            if(userData.username !== tab){
                privateChats.get(tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.send('/app/private-message',{},JSON.stringify(chatMessage));
            setUserData({...userData,"message":""});
        }
    }

    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});
    }

    const registerUser=()=>{
        connect();
    }

    return (
        <div className="container">
            {userData.connected?
            <div className="chat-box">
                <div className="member-list">
                    <h1>Chats</h1>
                    <ul>
                    <li onClick={() => setTab("CHATROOM")} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
                    {privateChatNames.map((name, index) => (
                        <li onClick={() => { setTab(name); setSelectedChat(name); }} className={`member ${tab === name && "active"}`} key={index}>
                        {name}
                        </li>
                    ))}
                    </ul>
                </div>
                {tab === "CHATROOM" && <div className="chat-content">
                    <h3>Chatroom</h3>
                    <ul className="chat-messages">
                        {publicChats.map((chat,index)=>(
                            <div className="message-container">
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <li className={`message ${chat.senderName === userData.username ? 'self' : ''}`} key={index}>
                                    <div className="message-data">{chat.message}</div>
                                    {/* {chat.senderName === userData.username && <div className="avatar self">{chat.senderName.charAt(0)}</div>} */}
                                </li>   
                            </div>                       
                        ))}
                    </ul>
                    <div className="send-message">
                        <input type="text" className="input-message" name="message" placeholder="Enter message" value={userData.message} onChange={handleMessage}/>
                        <button type="button" className="send-button" onClick={sendPublicMessage}>send</button>
                    </div>
                </div>}
                {tab !== "CHATROOM" && <div className="chat-content">
                    <h3>{selectedChat}</h3>
                    <ul className="chat-messages">
                        {[...privateChats.get(tab)].map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username ? 'self' : ''}`} key={index}>
                                {/* {chat.senderName !== userData.username && <div className="avatar">{chat.senderName.charAt(0)}</div>} */}
                                <div className="message-data">{chat.message}</div>
                                {/* {chat.senderName === userData.username && <div className="avatar self">{chat.senderName.charAt(0)}</div>} */}
                            </li>                          
                        ))}
                    </ul>
                    <div className="send-message">
                        <input type="text" className="input-message" name="message" placeholder={`Enter message for ${tab}`} value={userData.message} onChange={handleMessage}/>
                        <button type="button" className="send-button" onClick={sendPrivateMessage}>send</button>
                    </div>
                </div>}
            </div>
            :
            <div className="register">
                <input
                id="user-name"
                placeholder="Enter your username"
                name="userName"
                value={userData.username}
                onChange={handleUsername}
                />
                <button type="button" onClick={registerUser}>
                    connect
                </button>
            </div>}
        </div>
    )
}

export default ChatRoom;