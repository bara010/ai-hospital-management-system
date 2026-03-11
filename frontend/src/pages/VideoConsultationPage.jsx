import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AppLayout from '../components/AppLayout';
import Loading from '../components/Loading';
import { appointmentApi } from '../services/hospitoApi';
import { useAuth } from '../hooks/useAuth';

function buildWsBaseUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  return apiBase.replace(/\/api\/?$/, '');
}

function resolveIceServers() {
  const fallback = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const raw = import.meta.env.VITE_WEBRTC_ICE_SERVERS;
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    const valid = parsed.filter((item) => item && typeof item === 'object' && item.urls);
    return valid.length ? valid : fallback;
  } catch {
    return fallback;
  }
}

export default function VideoConsultationPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const streamRef = useRef(null);
  const stompClientRef = useRef(null);
  const queuedIceCandidatesRef = useRef([]);
  const remoteDescriptionSetRef = useRef(false);

  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState('Connecting');

  const roomId = appointment?.meetingRoomId;

  const sendSignal = (payload, roomOverride = null) => {
    const client = stompClientRef.current;
    const targetRoomId = roomOverride || roomId;
    if (!client || !client.connected || !targetRoomId || !user?.id) return;

    client.publish({
      destination: `/app/signal/${targetRoomId}`,
      body: JSON.stringify({ ...payload, senderId: user.id }),
    });
  };

  const flushQueuedCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteDescriptionSetRef.current) return;

    while (queuedIceCandidatesRef.current.length > 0) {
      const candidate = queuedIceCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // Ignore stale ICE candidates.
      }
    }
  };

  const createAndSendOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.signalingState !== 'stable') return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type: 'offer', sdp: offer.sdp });
  };

  const ensurePeerConnection = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection({
      iceServers: resolveIceServers(),
    });

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      sendSignal({
        type: 'candidate',
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
      });
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setConnectionState('Connected');
          break;
        case 'connecting':
          setConnectionState('Connecting');
          break;
        case 'failed':
          setConnectionState('Connection Failed');
          setError('Video connection failed. Please rejoin the call.');
          break;
        case 'disconnected':
          setConnectionState('Disconnected');
          break;
        case 'closed':
          setConnectionState('Call Ended');
          break;
        default:
          setConnectionState('Connecting');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleSignalMessage = async (signal) => {
    if (!signal || signal.senderId === user?.id) return;

    const pc = ensurePeerConnection();

    if (signal.type === 'join' && user?.role === 'DOCTOR') {
      await createAndSendOffer();
      return;
    }

    if (signal.type === 'offer' && signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
      remoteDescriptionSetRef.current = true;
      await flushQueuedCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ type: 'answer', sdp: answer.sdp });
      return;
    }

    if (signal.type === 'answer' && signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      remoteDescriptionSetRef.current = true;
      await flushQueuedCandidates();
      return;
    }

    if (signal.type === 'candidate' && signal.candidate) {
      const candidate = new RTCIceCandidate({
        candidate: signal.candidate,
        sdpMid: signal.sdpMid,
        sdpMLineIndex: signal.sdpMLineIndex,
      });

      if (!remoteDescriptionSetRef.current) {
        queuedIceCandidatesRef.current.push(candidate);
        return;
      }

      await pc.addIceCandidate(candidate);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoading(true);
      setError('');
      setConnectionState('Connecting');
      queuedIceCandidatesRef.current = [];
      remoteDescriptionSetRef.current = false;

      try {
        const details = await appointmentApi.details(appointmentId);
        if (!active) return;

        if (details.status !== 'APPROVED' && details.status !== 'COMPLETED') {
          setError('Video consultation is available only for approved or completed appointments.');
          setLoading(false);
          return;
        }

        setAppointment(details);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        ensurePeerConnection();

        const wsBase = buildWsBaseUrl();
        const client = new Client({
          webSocketFactory: () => new SockJS(`${wsBase}/ws-signaling`),
          reconnectDelay: 3000,
          debug: () => {},
        });

        client.onConnect = () => {
          client.subscribe(`/topic/signal/${details.meetingRoomId}`, async (message) => {
            try {
              const signal = JSON.parse(message.body);
              await handleSignalMessage(signal);
            } catch {
              // Ignore malformed signaling messages.
            }
          });

          sendSignal({ type: 'join' }, details.meetingRoomId);
        };

        client.onStompError = () => {
          setError('Signaling service error. Please refresh and try again.');
        };

        client.activate();
        stompClientRef.current = client;
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to start video consultation.');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      active = false;

      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      queuedIceCandidatesRef.current = [];
      remoteDescriptionSetRef.current = false;
    };
  }, [appointmentId]);

  const toggleMute = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setCameraOff((prev) => !prev);
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
    navigate(-1);
  };

  return (
    <AppLayout>
      <section className="panel">
        <h2>Video Consultation</h2>
        {loading ? <Loading label="Preparing secure video room..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {appointment ? (
          <p>
            Appointment #{appointment.id} | Room: <strong>{appointment.meetingRoomId}</strong> | Status:{' '}
            <strong>{connectionState}</strong>
          </p>
        ) : null}

        <div className="video-grid">
          <div>
            <h3>Your Video</h3>
            <video ref={localVideoRef} autoPlay playsInline muted className="video-panel" />
          </div>
          <div>
            <h3>Remote Video</h3>
            <video ref={remoteVideoRef} autoPlay playsInline className="video-panel" />
          </div>
        </div>

        <div className="row-actions">
          <button className="btn secondary" onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
          <button className="btn secondary" onClick={toggleCamera}>{cameraOff ? 'Camera On' : 'Camera Off'}</button>
          <button className="btn ghost" onClick={endCall}>End Call</button>
        </div>
      </section>
    </AppLayout>
  );
}
