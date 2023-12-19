import React, { useState, useEffect  } from "react";
import '../index.css';
import {over} from 'stompjs';
import SockJS from "sockjs-client";
import IncomingCallPopup from './IncomingCallPopup';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';


var stompClient =null;
const ChatRoom = () => {
    const [publicChats, setPublicChats] = useState([]);
    const [privateChats, setPrivateChats] = useState(new Map());
    const [tab, setTab] = useState("CHATROOM");
    const [selectedChat, setSelectedChat] = useState(null);
    const privateChatNames = [...privateChats.keys()];

    const [incomingCall, setIncomingCall] = useState(""); // Add this line
    const [callStatus, setCallStatus] = useState('IDLE'); // Other possible values: 'WAITING', 'CONNECTED'
    const [incomingCallData, setIncomingCallData] = useState(null);
// Add these state variables
const [showNotification, setShowNotification] = useState(false);
const [notificationMessage, setNotificationMessage] = useState("");

  let peerConnection = null;
  const [isVideoCallModalOpen, setVideoCallModalOpen] = useState(false);

  const openVideoCallModal = () => {
    setVideoCallModalOpen(true);
  };

  const closeVideoCallModal = () => {
    setVideoCallModalOpen(false);
    localStorage.setItem('STATUS','');
  };
    
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callTarget, setCallTarget] = useState("");
    
    
    const [userData, setUserData] = useState({
        username:"",
        receivername:"",
        connected:false,
        message:""
    })

    // Initialize WebRTC
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            setLocalStream(stream);
            setRemoteStream(stream);

            const intervalId = setInterval(() => {
              // Your periodic check or action here
          
              const stat = localStorage.getItem('STATUS');
              if (stat === 'CONNECT') {
                setCallStatus('CONNECTED');
              } else {
                setCallStatus('');
              }
            }, 1000); // Run every 5 seconds, adjust as needed
          
            // Clean up the interval on component unmount
            return () => {
              clearInterval(intervalId);
              localStorage.setItem('STATUS', '');
            };     

        })
        .catch((error) => {
            console.error("Error accessing user media:", error);
        });
    }, []);

    // const startVideoCall = (targetUsername) => {
    //     // Add your video call logic here
    //     // For example, you can use the startCall function
    //     console.log(targetUsername);
    //     startCall(targetUsername);
    //   };

    const answerCall = () => {
        // Handle logic for accepting the call
        // For example, you can start the WebRTC connection
        setCallStatus('CONNECTED');
        console.log('ACCEPTED');

        localStorage.setItem('STATUS', 'CONNECT');
        
        setVideoCallModalOpen(true);
        console.log(isVideoCallModalOpen);

        if (localStream && stompClient) {
          peerConnection = new RTCPeerConnection(); // Use the existing peerConnection variable
    
          // Add local stream to the connection
          localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
          });
    
          // Set up event handlers
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              // Send ICE candidate through SockJS
              const iceCandidateMessage = {
                senderName: userData.username,
                receiverName: incomingCallData.receiverName,
                status: 'ICE_CANDIDATE',
                ice: event.candidate,
              };
              stompClient.send('/app/private-message', {}, JSON.stringify(iceCandidateMessage));
            }
          };
    
          peerConnection.createOffer()
            .then((offer) => peerConnection.setLocalDescription(offer))
            .then(() => {
              // Send the offer through SockJS
              const offerMessage = {
                senderName: userData.username,
                receiverName: incomingCallData.receiverName,
                status: 'OFFER',
                sdp: peerConnection.localDescription,
              };
              stompClient.send('/app/private-message', {}, JSON.stringify(offerMessage));
            })
            .catch((error) => {
              console.error('Error creating offer:', error);
            });
        }

        setIncomingCallData(null);
      };
      
      const rejectCall = () => {
        // Handle logic for rejecting the call
        setIncomingCallData(null);
      };
      
    const setSrcObjectSafely = (video, stream) => {
        if (video) {
          try {
            video.srcObject = stream;
          } catch (error) {
            console.error('Error setting srcObject:', error);
          }
        } else {
          console.warn('Video element is null or undefined.');
        }
      };
      const setSrcObjectSafelyForRemote = (video, stream) => {
        if (video) {
          try {
            video.srcObject = stream;
          } catch (error) {
            console.error('Error setting srcObject:', error);
          }
        } else {
          console.warn('Video element is null or undefined.');
        }
      };

    // const startVideoCall = (targetUsername) => {
    //     console.log(targetUsername);
    //     startCall(targetUsername);
    //     setVideoCallModalOpen(true);
    //     console.log(isVideoCallModalOpen);
    //     if (localStream && stompClient) {
    //       const peerConnection = new RTCPeerConnection();
      
    //       // Add local stream to the connection
    //       localStream.getTracks().forEach((track) => {
    //         peerConnection.addTrack(track, localStream);
    //       });
      
    //       // Set up event handlers
    //       peerConnection.onicecandidate = (event) => {
    //         if (event.candidate) {
    //           // Send ICE candidate through SockJS
    //           const iceCandidateMessage = {
    //             senderName: userData.username,
    //             receiverName: targetUsername,
    //             status: 'ICE_CANDIDATE',
    //             ice: event.candidate,
    //           };
    //           stompClient.send('/app/private-message', {}, JSON.stringify(iceCandidateMessage));
    //         }
    //       };
      
    //       peerConnection.createOffer()
    //         .then((offer) => peerConnection.setLocalDescription(offer))
    //         .then(() => {
    //           // Send the offer through SockJS
    //           const offerMessage = {
    //             senderName: userData.username,
    //             receiverName: targetUsername,
    //             status: 'OFFER',
    //             sdp: peerConnection.localDescription,
    //           };
    //           stompClient.send('/app/private-message', {}, JSON.stringify(offerMessage));
    //         })
    //         .catch((error) => {
    //           console.error('Error creating offer:', error);
    //         });
    //     }
    //   };

    const sendPrivateCall = () => {
        if(stompClient){
            let chatMessage={
                senderName:userData.username,
                receiverName:tab,
                message:<IncomingCallPopup
                callerName={userData.senderName}
                onAccept={() => answerCall()}
                onReject={() => rejectCall()}
              />,
                status:'CALL'
            };
            if(userData.username !== tab){
                privateChats.get(tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.send('/app/private-message',{},JSON.stringify(chatMessage));
            setUserData({...userData,"message":""});
        }
    }

    const startVideoCall = (targetUsername) => {
        console.log(targetUsername);
        startCall(targetUsername);
        setVideoCallModalOpen(true);
        console.log(isVideoCallModalOpen);
        setIncomingCall(targetUsername);
        setIncomingCallData(targetUsername);
        // sendPrivateCall();
        setCallStatus('WAITING');
        if (localStream && stompClient) {
          peerConnection = new RTCPeerConnection(); // Use the existing peerConnection variable
    
          // Add local stream to the connection
          localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
          });
    
          // Set up event handlers
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              // Send ICE candidate through SockJS
              const iceCandidateMessage = {
                senderName: userData.username,
                receiverName: targetUsername,
                status: 'ICE_CANDIDATE',
                ice: event.candidate,
              };
              stompClient.send('/app/private-message', {}, JSON.stringify(iceCandidateMessage));
            }
          };
    
          peerConnection.createOffer()
            .then((offer) => peerConnection.setLocalDescription(offer))
            .then(() => {
              // Send the offer through SockJS
              const offerMessage = {
                senderName: userData.username,
                receiverName: targetUsername,
                status: 'OFFER',
                sdp: peerConnection.localDescription,
              };
              stompClient.send('/app/private-message', {}, JSON.stringify(offerMessage));
            })
            .catch((error) => {
              console.error('Error creating offer:', error);
            });
        }
      };
      
      const closeWebRTC = () => {
        if (peerConnection) {
          // Close the RTCPeerConnection
          peerConnection.close();
          peerConnection = null;
        }
      
        // Stop the local stream
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            track.stop();
          });
          setLocalStream(null);
        }
      
        // Remove event listeners
        if (peerConnection) {
          peerConnection.onicecandidate = null;
          peerConnection.ontrack = null;
          // Add more event listener removals as needed
        }
      };
      

  const startCall = (targetUsername) => {
    if (stompClient) {
      const callMessage = {
        senderName: userData.username,
        receiverName: targetUsername,
        status: 'CALL',
      };
      stompClient.send('/app/private-message', {}, JSON.stringify(callMessage));
      setIsCalling(true);
      setCallTarget(targetUsername);
    }
  };
  
  const hangUp = () => {
    localStorage.setItem('STATUS', '');
    if (stompClient) {
      const hangUpMessage = {
        senderName: userData.username,
        receiverName: callTarget,
        status: 'HANG_UP',
      };
      stompClient.send('/app/hang-up', {}, JSON.stringify(hangUpMessage));
      setIsCalling(false);
      setCallTarget("");
    }
  };
  
    
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

    // const onPrivateMessageReceived =(payload)=>{
    //     let payloadData=JSON.parse(payload.body);
    //     if(privateChats.get(payloadData.senderName)){
    //         privateChats.get(payloadData.senderName).push(payloadData);
    //         setPrivateChats(new Map(privateChats));
    //     } else {
    //         let list=[];
    //         list.push(payloadData);
    //         privateChats.set(payloadData.senderName,list);
    //         setPrivateChats(new Map(privateChats));
    //     }
    // }

    const onPrivateMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body);
        if (payloadData.status === 'CALL') {
          setIncomingCallData(payloadData);
          setIncomingCall(payloadData.senderName);
          setCallStatus('WAITING');
      
          // Set state to display the notification
          setShowNotification(true);
      
          // Hide the notification after a certain period (adjust as needed)
          setTimeout(() => {
            setShowNotification(false);
          }, 5000); // Display for 5 seconds, adjust as needed

          
        } else if (payloadData.status === 'HANG_UP') {
          setIsCalling(false);
          setCallTarget("");
          closeWebRTC();
        } else if (privateChats.get(payloadData.senderName)) {
          privateChats.get(payloadData.senderName).push(payloadData);
          setPrivateChats(new Map(privateChats));
        } else {
          let list = [];
          list.push(payloadData);
          privateChats.set(payloadData.senderName, list);
          setPrivateChats(new Map(privateChats));
        }
      };
      
      
    const cancelCall = () => {
      localStorage.setItem('STATUS', '');
      setIncomingCall(null);
      setIncomingCallData(null);
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

    const NotificationModal = ({ message, onClose }) => {
        return (
          <div className="notification-modal">
            <p>{message}</p>
            <button onClick={onClose}>Close</button>
          </div>
        );
      };
      

    return (
        <div className="container">
            {userData.connected?
            <div className="chat-box">
                <div className="member-list" style={{borderRight: '1px solid gray'}}>
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
                  <div className="d-flex justify-content-between">
                    <h3>{selectedChat}</h3>
                    <button
                    type="button"
                    className="video-icon vid"
                    onClick={() => startVideoCall(tab)}
                  >
                    <i style={{height:'500px'}} class="bi bi-camera-video-fill"></i>
                  </button></div>
                
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
              

                    {incomingCallData && userData.username === incomingCallData.receiverName && (
                    <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center justify-content-center" style={{width: '70vw', height: '90vh', position: 'absolute', background: '#fefefe', color: 'black', border:'1px solid gray'}}>
                    <IncomingCallPopup
                        callerName={incomingCallData.senderName}
                        onAccept={() => answerCall()}
                        onReject={() => cancelCall()}
                      />
                      </div>
                    )}
                    {/* {incomingCallData && userData.username !== incomingCallData.receiverName && (
                      <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center justify-content-center" style={{width: '70vw', height: '90vh', position: 'absolute', background: '#fefefe', color: 'black', border:'1px solid gray'}}>
                        <p>Calling {incomingCall}...</p>
                        <button type="button" className="btn btn-danger" onClick={cancelCall}>Cancel</button>
                      </div>
                    )} */}


{isVideoCallModalOpen && callStatus === 'CONNECTED' && (
<div className="position-absolute top-50 start-50 translate-middle" style={{width: '70vw', height: '90vh', position: 'absolute', background: '#fefefe', color: 'black', border:'1px solid gray'}}>
<div className="video-call-modal">
    <h5 className="text-center mt-3 pt-5 pb-5">Video call with {tab}</h5>
    <div className="video-container">
    {localStream && (
  <div className="row g-3">
    <div className="col">
      <video className="local-video" ref={(video) => setSrcObjectSafely(video, localStream)} autoPlay playsInline muted />
      <h6>{userData.username}</h6>
    </div>
    {remoteStream && (
      <div className="col">
        <video className="remote-video" ref={(video) => setSrcObjectSafelyForRemote(video, remoteStream)} autoPlay playsInline />
        <h6>{tab}</h6>
      </div>
    )}
  </div>
)}
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}} className="pt-5">
    <button className="btn btn-danger" style={{width: '30%'}}
      type="button"
      onClick={() => {
        closeVideoCallModal();
        hangUp();
      }}
    >
      Leave
    </button></div>
  </div>
</div>
)}
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