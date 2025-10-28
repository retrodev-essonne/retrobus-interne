import {
  Box, Heading, Text, Button, Stack, Input, Textarea, VStack, HStack,
  Spinner, Center, useToast, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../api/config";

// Build API URLs that always include the /api prefix and support same-origin when no base is set
const BASE = (API_BASE_URL || (import.meta.env.VITE_API_URL || "")).replace(/\/+$/, "");
const PREFIX = (import.meta.env.VITE_API_PREFIX || localStorage.getItem('rbe_api_prefix') || "api").replace(/^\/+|\/+$/g, "");
const getVehiclesPath = () => (localStorage.getItem('rbe_api_vehicles_path') || `${PREFIX}/vehicles`).replace(/^\/+/, '').replace(/\/+$/, '');
const getOrigin = () => (localStorage.getItem('rbe_api_origin') || BASE).replace(/\/+$/, '');

const buildCandidates = (resourcePath) => {
  const path = String(resourcePath || '').replace(/^\/+/, '');
  const origin = getOrigin();
  const rel = `/${path}`; // relative (same-origin via dev proxy)
  const abs = origin ? `${origin}/${path}` : null;
  const list = [rel];
  if (abs) list.push(abs);
  return list;
};

const fetchJsonFirst = async (urls, init) => {
  let lastErr = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, init);
      if (!r.ok) { lastErr = new Error(`HTTP ${r.status}`); continue; }
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) { lastErr = new Error('non-json'); continue; }
      return await r.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('fetch failed');
};

/**
 * Page mobile d'accès via QR
 * - URL expected: /mobile/v/:parc?t=<token>
 * - If token valid, we fetch vehicle and allow anonymous writes via token header.
 * - If token invalid or absent, user must authenticate (matricule) via UserContext.
 */
export default function MobileVehicle() {
  const { parc } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const nav = useNavigate();

  const tokenFromUrl = searchParams.get("t") || "";
  const { matricule, setMatricule, token: authToken } = useUser();

  const [token, setToken] = useState(tokenFromUrl || "");
  const [veh, setVeh] = useState(null);
  const [events, setEvents] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [showAnomaly, setShowAnomaly] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [showEvent, setShowEvent] = useState(false);

  // auth form (matricule) for fallback
  const [inputMatricule, setInputMatricule] = useState(matricule || "");
  const [authLoading, setAuthLoading] = useState(false);

  // members for passage modal
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");

  const loadMembers = async () => {
    if (!authToken) return; // need JWT
    try {
      setMembersLoading(true);
      const urls = buildCandidates(`${(import.meta.env.VITE_API_PREFIX || localStorage.getItem('rbe_api_prefix') || 'api').replace(/^\/+/,'')}/members?limit=500`);
      const data = await fetchJsonFirst(urls, { headers: { Authorization: `Bearer ${authToken}` } });
      setMembers(Array.isArray(data?.members) ? data.members : []);
    } catch (e) {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // headers to use for API calls (token preferred)
  const headersFor = (t = token, useMatricule = matricule) => {
    const h = { "Content-Type": "application/json" };
    if (t) h["x-qr-token"] = t;
    else if (useMatricule) h["x-user-matricule"] = useMatricule;
    // If user is logged in with standard credentials, include JWT too
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;
    return h;
  };

  // fetch vehicle + related data
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setLoading(true);
        const h = headersFor(token);
        const basePath = getVehiclesPath();
        const vehUrls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}`);
  // Server expects "reports" for vehicle-specific events
  const evUrls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}/reports`);
        const usUrls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}/usages`);
        const [rv, re, ru] = await Promise.all([
          fetchJsonFirst(vehUrls, { headers: h }),
          fetchJsonFirst(evUrls, { headers: h }).catch(() => []),
          fetchJsonFirst(usUrls, { headers: h }).catch(() => []),
        ]);
        if (stop) return;
        setVeh(rv);
        // Normalize report objects into UI-friendly event items
        const normalizedEvents = Array.isArray(re) ? re.map(r => ({
          id: r.id,
          type: r.type || 'Rapport',
          date: r.createdAt || r.date || new Date().toISOString(),
          note: r.description || r.note || '',
          createdBy: r.createdBy || r.author || '—',
        })) : [];
        setEvents(normalizedEvents);
        setUsages(Array.isArray(ru) ? ru : []);
      } catch (err) {
        // token invalid or other error — clear vehicle so user must auth
        console.warn("fetch vehicle failed:", err);
        setVeh(null);
        setEvents([]);
        setUsages([]);
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [parc, token]);

  const onAuthenticate = async (e) => {
    e?.preventDefault?.();
    if (!inputMatricule?.trim()) return toast({ status: "warning", title: "Matricule requis" });
    try {
      setAuthLoading(true);
      // simulate auth — here simply store matricule in context
      // if you have server auth, replace this by an API call
      setMatricule(inputMatricule.trim());
      toast({ status: "success", title: "Connecté", description: inputMatricule.trim() });
      // re-fetch using matricule header
      setToken(""); // ensure using matricule
      setTimeout(() => {
        // small delay to let header propagate
        (async () => {
          try {
            setLoading(true);
            const h = headersFor('', inputMatricule.trim());
            const basePath = getVehiclesPath();
            const vehUrls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}`);
            const evUrls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}/reports`);
            const usUrls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}/usages`);
            const [rv, re, ru] = await Promise.all([
              fetchJsonFirst(vehUrls, { headers: h }),
              fetchJsonFirst(evUrls, { headers: h }).catch(() => []),
              fetchJsonFirst(usUrls, { headers: h }).catch(() => []),
            ]);
            setVeh(rv);
            const normalizedEvents = Array.isArray(re) ? re.map(r => ({
              id: r.id,
              type: r.type || 'Rapport',
              date: r.createdAt || r.date || new Date().toISOString(),
              note: r.description || r.note || '',
              createdBy: r.createdBy || r.author || '—',
            })) : [];
            setEvents(normalizedEvents);
            setUsages(Array.isArray(ru) ? ru : []);
          } catch (err) {
            toast({ status: "error", title: "Accès refusé" });
          } finally {
            setLoading(false);
          }
        })();
      }, 250);
    } finally {
      setAuthLoading(false);
    }
  };

  // submit helpers
  const postEvent = async (payload) => {
    try {
      const basePath = getVehiclesPath();
      const urls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}/reports`);
      const r = await fetch(urls[0], {
        method: "POST",
        headers: headersFor(),
        // backend expects { description, usageId?, filesMeta? }
        body: JSON.stringify({ description: payload?.note ? `${payload.type || 'Événement'}: ${payload.note}` : (payload?.type || 'Événement') }),
      });
      if (!r.ok) {
        const err = await r.json().catch(()=>({error:'err'}));
        throw new Error(err?.error || r.statusText || "Erreur");
      }
      const j = await r.json();
      const ev = {
        id: j.id,
        type: 'Rapport',
        date: j.createdAt || new Date().toISOString(),
        note: j.description || '',
        createdBy: j.createdBy || '—',
      };
      setEvents(prev => [ev, ...prev]);
      toast({ status: "success", title: "Événement ajouté" });
      return j;
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "Impossible d'ajouter l'événement", description: String(e.message) });
      throw e;
    }
  };

  const postUsage = async (payload) => {
    try {
      const basePath = getVehiclesPath();
      const urls = buildCandidates(`${basePath}/${encodeURIComponent(parc)}/usages`);
      const r = await fetch(urls[0], {
        method: "POST",
        headers: headersFor(),
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(()=>({error:'err'}));
        throw new Error(err?.error || r.statusText || "Erreur");
      }
      const j = await r.json();
      setUsages(prev => [j, ...prev]);
      toast({ status: "success", title: "Usage ajouté" });
      return j;
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "Impossible d'ajouter l'usage", description: String(e.message) });
      throw e;
    }
  };

  // If loading show spinner, if no vehicle and no token -> show authentication form (matricule)
  if (loading) return <Center p={8}><Spinner size="lg" /></Center>;

  return (
    <Box p={4} maxW="720px" mx="auto">
      {(!veh) ? (
        <Box textAlign="center" py={8}>
          <Heading size="md">Accès restreint</Heading>
          <Text mt={2} opacity={0.8}>
            Ce carnet est accessible uniquement via le QR code du véhicule ou après authentification.
          </Text>

          <Box mt={6} as="form" onSubmit={onAuthenticate} maxW="360px" mx="auto">
            <VStack spacing={3}>
              <FormControl>
                <FormLabel>Matricule</FormLabel>
                <Input value={inputMatricule} onChange={e => setInputMatricule(e.target.value)} placeholder="ex: w.belaidi" />
              </FormControl>
              <HStack>
                <Button colorScheme="blue" onClick={onAuthenticate} isLoading={authLoading}>Se connecter</Button>
                <Button variant="ghost" onClick={() => nav(-1)}>Retour</Button>
              </HStack>
            </VStack>
          </Box>

          <Text mt={4} fontSize="sm" opacity={0.8}>
            Astuce : scannez le QR sur le véhicule pour accéder sans vous connecter.
          </Text>
        </Box>
      ) : (
        // Main mobile dashboard
        <Box>
          <Heading size="md">{veh.modele || `Parc ${veh.parc}`}</Heading>
          <Text mt={1} opacity={0.8}>{veh.immat ? `${veh.immat} · Parc ${veh.parc}` : `Parc ${veh.parc}`}</Text>

          <Stack spacing={4} mt={6}>
            <Button colorScheme="red" onClick={() => setShowAnomaly(true)}>Signaler une anomalie</Button>
            <Button colorScheme="orange" onClick={() => setShowPassage(true)}>Signaler un passage</Button>
            <Button colorScheme="blue" onClick={() => setShowEvent(true)}>Ajouter un évènement au véhicule</Button>
          </Stack>

          <Box mt={6}>
            <Heading size="sm" mb={2}>Derniers événements</Heading>
            <VStack spacing={2} align="stretch">
              {events.length === 0 && <Text opacity={0.7}>Aucun événement</Text>}
              {events.map(ev => (
                <Box key={ev.id} p={3} border="1px solid #eee" borderRadius="md">
                  <Text fontSize="sm"><b>{ev.type}</b> · {new Date(ev.date).toLocaleString()}</Text>
                  {ev.note && <Text mt={1} fontSize="sm">{ev.note}</Text>}
                  <Text mt={1} fontSize="xs" opacity={0.7}>Ajouté par {ev.createdBy || '—'}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Box mt={6}>
            <Heading size="sm" mb={2}>Derniers passages</Heading>
            <VStack spacing={2} align="stretch">
              {usages.length === 0 && <Text opacity={0.7}>Aucun passage</Text>}
              {usages.map(u => (
                <Box key={u.id} p={3} border="1px solid #eee" borderRadius="md">
                  <Text fontSize="sm">{u.conducteur || '—'} · {u.km ? `${u.km} km` : '—'} · {u.durationMin ? `${u.durationMin} min` : ''}</Text>
                  {u.note && <Text mt={1} fontSize="sm">{u.note}</Text>}
                  <Text mt={1} fontSize="xs" opacity={0.7}>Ajouté par {u.createdBy || '—'}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </Box>
      )}

      {/* Modals */}

      {/* Anomaly modal */}
      <Modal isOpen={showAnomaly} onClose={() => setShowAnomaly(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Signaler une anomalie</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" opacity={0.8}>
                Véhicule : <b>{veh?.parc}</b> {veh?.immat ? `· ${veh.immat}` : ""}
              </Text>
              <FormControl>
                <FormLabel>Type d'anomalie</FormLabel>
                <Input id="anom-type" placeholder="ex: Frein / Porte / Moteur" />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea id="anom-note" placeholder="Décris l'anomalie..." />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowAnomaly(false)}>Annuler</Button>
            <Button colorScheme="red" onClick={async () => {
              const type = document.getElementById("anom-type")?.value || "Anomalie";
              const note = document.getElementById("anom-note")?.value || "";
              try {
                await postEvent({ type: `Anomalie: ${type}`, note });
                setShowAnomaly(false);
              } catch {}
            }}>Signaler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Passage modal */}
      <Modal isOpen={showPassage} onClose={() => setShowPassage(false)} isCentered onOverlayClick={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Signaler un passage</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" opacity={0.8}>Véhicule : <b>{veh?.parc}</b> {veh?.immat ? `· ${veh.immat}` : ""}</Text>
              <FormControl>
                <FormLabel>Conducteur</FormLabel>
                <Input id="pass-conducteur" placeholder="Nom ou matricule" />
              </FormControl>
              <FormControl>
                <FormLabel>Membres présents</FormLabel>
                <Input
                  placeholder="Rechercher un adhérent (nom, prénom, n°)"
                  value={memberSearch}
                  onChange={(e)=>setMemberSearch(e.target.value)}
                  onFocus={() => { if (members.length===0) loadMembers(); }}
                />
                <Box mt={2} maxH="180px" overflowY="auto" border="1px solid #eee" borderRadius="md" p={2}>
                  {membersLoading && <Center py={3}><Spinner size="sm"/></Center>}
                  {!membersLoading && members
                    .filter(m => {
                      if (!memberSearch.trim()) return true;
                      const q = memberSearch.toLowerCase();
                      return [m.firstName, m.lastName, m.memberNumber, m.email]
                        .filter(Boolean)
                        .some(v => String(v).toLowerCase().includes(q));
                    })
                    .slice(0, 50)
                    .map(m => {
                      const id = m.id;
                      const checked = selectedMemberIds.includes(id);
                      const label = `${m.lastName?.toUpperCase() || ''} ${m.firstName || ''}${m.memberNumber ? ` · ${m.memberNumber}` : ''}`.trim();
                      return (
                        <HStack key={id} py={1} spacing={3}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e)=>{
                              setSelectedMemberIds(prev => e.target.checked ? [...prev, id] : prev.filter(x=>x!==id));
                            }}
                          />
                          <Text fontSize="sm">{label}</Text>
                        </HStack>
                      );
                    })}
                  {!membersLoading && members.length===0 && (
                    <Text fontSize="sm" opacity={0.7}>Aucun adhérent chargé. Connectez-vous pour voir la liste.</Text>
                  )}
                </Box>
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Invité - Prénom</FormLabel>
                  <Input value={guestFirstName} onChange={(e)=>setGuestFirstName(e.target.value)} placeholder="Prénom invité" />
                </FormControl>
                <FormControl>
                  <FormLabel>Invité - Nom</FormLabel>
                  <Input value={guestLastName} onChange={(e)=>setGuestLastName(e.target.value)} placeholder="Nom invité" />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowPassage(false)}>Annuler</Button>
            <Button colorScheme="orange" onClick={async () => {
              const conducteur = document.getElementById("pass-conducteur")?.value || "";
              // Build participants string from selected members + guest
              const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
              const memberNames = selectedMembers.map(m => `${m.firstName || ''} ${m.lastName || ''}`.trim()).filter(Boolean);
              const guestName = (guestFirstName || guestLastName) ? `Invité: ${[guestFirstName, guestLastName].filter(Boolean).join(' ')}` : '';
              const participantsStr = [
                conducteur ? `Conducteur: ${conducteur}` : '',
                ...memberNames,
                guestName
              ].filter(Boolean).join('; ');
              try {
                await postUsage({
                  startedAt: new Date().toISOString(),
                  conducteur: conducteur || null,
                  participants: participantsStr || null,
                  note: ""
                });
                setShowPassage(false);
                setSelectedMemberIds([]); setGuestFirstName(''); setGuestLastName(''); setMemberSearch('');
              } catch {}
            }}>Signaler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Generic event modal */}
      <Modal isOpen={showEvent} onClose={() => setShowEvent(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un événement</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" opacity={0.8}>Véhicule : <b>{veh?.parc}</b></Text>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Input id="evt-type" placeholder="ex: Révision" />
              </FormControl>
              <FormControl>
                <FormLabel>Note</FormLabel>
                <Textarea id="evt-note" placeholder="Détails..." />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowEvent(false)}>Annuler</Button>
            <Button colorScheme="blue" onClick={async () => {
              const type = document.getElementById("evt-type")?.value || "Événement";
              const note = document.getElementById("evt-note")?.value || "";
              try {
                await postEvent({ type, note });
                setShowEvent(false);
              } catch {}
            }}>Ajouter</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
