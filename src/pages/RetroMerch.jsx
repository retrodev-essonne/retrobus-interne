import React, { useEffect, useMemo, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardBody,
	CardHeader,
	Center,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	HStack,
	Heading,
	IconButton,
	Image,
	Input,
	NumberInput,
	NumberInputField,
	Select,
	SimpleGrid,
	Switch,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Tag,
	TagLabel,
	Text,
	Textarea,
	Tooltip,
	VStack,
	useDisclosure,
	useToast,
	Table, Thead, Tbody, Tr, Th, Td
} from "@chakra-ui/react";
import { FiEdit, FiPlus, FiTrash2, FiSettings, FiPackage, FiShoppingCart, FiCopy, FiEye, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from "react-icons/fi";

// Internal RetroMerch Admin — MVP skeleton
// Scope: Catalogue, Commandes, Catégories, Mise en page, Paramètres
// Data: in-memory for now (to be backed by API later)

function ProductCard({ p, onEdit, onDelete }) {
	return (
		<Card overflow="hidden">
			<Image
				src={p.image || "/assets/fallback/_MG_1006.jpg"}
				alt={p.name}
				w="100%"
				h="160px"
				objectFit="cover"
			/>
			<CardBody>
				<VStack align="stretch" spacing={2}>
					<HStack justify="space-between" align="start">
						<Box>
							<Heading size="sm">{p.name}</Heading>
							<Text fontSize="sm" color="gray.600">{p.category}</Text>
						</Box>
						<Tag size="sm" colorScheme={p.active ? "green" : "gray"}><TagLabel>{p.active ? "Actif" : "Masqué"}</TagLabel></Tag>
					</HStack>
					<HStack justify="space-between">
						<Text fontWeight="bold">{p.price.toFixed(2)} €</Text>
						<HStack>
							<IconButton aria-label="Éditer" size="sm" icon={<FiEdit />} onClick={() => onEdit(p)} />
							<IconButton aria-label="Supprimer" size="sm" colorScheme="red" icon={<FiTrash2 />} onClick={() => onDelete(p)} />
						</HStack>
					</HStack>
				</VStack>
			</CardBody>
		</Card>
	);
}

export default function RetroMerch() {
	const toast = useToast();
	// Sample in-memory data (replace with API later)
	const [categories, setCategories] = useState(["Textiles", "Goodies", "Affiches"]);
	const [products, setProducts] = useState([
		{ id: "tee-classic", name: "T-shirt RétroBus Classique", price: 20, category: "Textiles", image: "", active: true },
		{ id: "mug-logo", name: "Mug Logo RBE", price: 12, category: "Goodies", image: "", active: true },
		{ id: "poster-920", name: "Affiche R312 n°920", price: 15, category: "Affiches", image: "", active: false }
	]);
	const [orders, setOrders] = useState([]); // will be fetched later
	const [filterCat, setFilterCat] = useState("Toutes");

	const [edit, setEdit] = useState(null);
	const [form, setForm] = useState({ id: "", name: "", price: 0, category: "Textiles", image: "", active: true, description: "" });
	const modal = useDisclosure();

	const filtered = useMemo(() => {
		if (filterCat === "Toutes") return products;
		return products.filter(p => p.category === filterCat);
	}, [products, filterCat]);

	const resetForm = () => setForm({ id: "", name: "", price: 0, category: categories[0] || "Textiles", image: "", active: true, description: "" });
	const openCreate = () => { setEdit(null); resetForm(); modal.onOpen(); };
	const openEdit = (p) => { setEdit(p); setForm({ ...p }); modal.onOpen(); };
	const saveProduct = () => {
		const id = (form.id || form.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
		if (!form.name || !id) return toast({ status: 'warning', title: 'Nom requis' });
		const next = { ...form, id };
		setProducts(prev => edit ? prev.map(p => p.id === edit.id ? next : p) : [{ ...next }, ...prev]);
		modal.onClose();
		toast({ status: 'success', title: edit ? 'Produit mis à jour' : 'Produit ajouté' });
	};
	const deleteProduct = (p) => {
		if (!confirm(`Supprimer ${p.name} ?`)) return;
		setProducts(prev => prev.filter(x => x.id !== p.id));
		toast({ status: 'info', title: 'Produit supprimé' });
	};

	// "Mise en page" — Puzzle builder state
	// Layout item shape: { id, type: 'banner'|'promo'|'product'|'grid'|'text'|'spacer', colSpan: 12|8|6|4|3, data: {...} }
	const defaultLayout = [
		{ id: 'hero-1', type: 'banner', colSpan: 12, data: { title: "Bienvenue sur RétroMerch", subtitle: "Sélection spéciale", image: '', ctaText: 'Découvrir', ctaHref: '/retromerch' } },
		{ id: 'promo-1', type: 'promo', colSpan: 6, data: { label: 'Promo', productId: 'tee-classic', discount: 20 } },
		{ id: 'product-1', type: 'product', colSpan: 6, data: { productId: 'mug-logo' } },
		{ id: 'grid-1', type: 'grid', colSpan: 12, data: { category: 'Textiles', count: 4 } },
	];
	const [layout, setLayout] = useState(() => {
		try {
			const saved = localStorage.getItem('retromerch_layout');
			return saved ? JSON.parse(saved) : defaultLayout;
		} catch (e) { return defaultLayout; }
	});
	const [selectedId, setSelectedId] = useState(null);
	const [showPreview, setShowPreview] = useState(true);

	useEffect(() => {
		try { localStorage.setItem('retromerch_layout', JSON.stringify(layout)); } catch (e) { /* ignore */ }
	}, [layout]);

	const makeId = (p) => `${p}-${Date.now().toString(36)}`;
	const addBlock = (type) => {
		const base = { colSpan: 12, data: {} };
		const item = { id: makeId(type), type, ...base };
		if (type === 'banner') item.data = { title: 'Titre', subtitle: 'Sous-titre', image: '', ctaText: 'Voir', ctaHref: '/retromerch' };
		if (type === 'promo') item.data = { label: 'Promo', productId: products[0]?.id || '', discount: 10 };
		if (type === 'product') item.data = { productId: products[0]?.id || '' };
		if (type === 'grid') item.data = { category: categories[0] || 'Textiles', count: 4 };
		if (type === 'text') item.data = { text: 'Texte libre de présentation…' };
		if (type === 'spacer') item.data = { size: 6 };
		setLayout(prev => [...prev, item]);
		setSelectedId(item.id);
	};
	const removeBlock = (id) => setLayout(prev => prev.filter(b => b.id !== id));
	const duplicateBlock = (id) => {
		const b = layout.find(x => x.id === id);
		if (!b) return;
		const copy = { ...b, id: makeId('copy') };
		const idx = layout.findIndex(x => x.id === id);
		const next = [...layout];
		next.splice(idx + 1, 0, copy);
		setLayout(next);
		setSelectedId(copy.id);
	};
	const updateBlock = (id, patch) => setLayout(prev => prev.map(b => b.id === id ? { ...b, ...patch, data: { ...b.data, ...(patch.data || {}) } } : b));
	const moveBlock = (id, dir) => {
		const idx = layout.findIndex(b => b.id === id);
		if (idx < 0) return;
		const next = [...layout];
		const swapWith = dir === 'up' ? idx - 1 : idx + 1;
		if (swapWith < 0 || swapWith >= next.length) return;
		[next[idx], next[swapWith]] = [next[swapWith], next[idx]];
		setLayout(next);
	};
	const changeSpan = (id, span) => updateBlock(id, { colSpan: span });
	// Basic drag-n-drop reorder
	const [dragId, setDragId] = useState(null);
	const onDragStart = (id) => (e) => { setDragId(id); e.dataTransfer.setData('text/plain', id); };
	const onDragOver = (e) => { e.preventDefault(); };
	const onDropOn = (targetId) => (e) => {
		e.preventDefault();
		const sourceId = dragId || e.dataTransfer.getData('text/plain');
		if (!sourceId || sourceId === targetId) return;
		const arr = [...layout];
		const si = arr.findIndex(b => b.id === sourceId);
		const ti = arr.findIndex(b => b.id === targetId);
		if (si === -1 || ti === -1) return;
		const [moved] = arr.splice(si, 1);
		arr.splice(ti, 0, moved);
		setLayout(arr);
		setDragId(null);
	};

	return (
		<Box p={6} maxW="7xl" mx="auto">
			<VStack align="stretch" spacing={6}>
				<HStack justify="space-between" align="center">
					<Heading size="lg" display="flex" alignItems="center" gap={2}>
						<FiPackage /> Administration RétroMerch
					</Heading>
					<HStack>
						<Button leftIcon={<FiPlus />} colorScheme="blue" onClick={openCreate}>Ajouter un produit</Button>
						<Button leftIcon={<FiSettings />} variant="outline">Paramètres</Button>
					</HStack>
				</HStack>

				<Tabs colorScheme="red" variant="enclosed">
					<TabList>
						<Tab display="flex" alignItems="center" gap={2}><FiPackage /> Catalogue</Tab>
						<Tab display="flex" alignItems="center" gap={2}><FiShoppingCart /> Commandes</Tab>
						<Tab>Catégories</Tab>
						<Tab>Mise en page</Tab>
						<Tab>Paramètres</Tab>
					</TabList>
					<TabPanels>
						{/* Catalogue */}
						<TabPanel px={0}>
							<Card>
								<CardHeader>
									<HStack justify="space-between" align="center">
										<Heading size="md">Catalogue</Heading>
										<HStack>
											<Select size="sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
												<option>Toutes</option>
												{categories.map(c => <option key={c}>{c}</option>)}
											</Select>
											<Button size="sm" onClick={openCreate} leftIcon={<FiPlus />}>Nouveau</Button>
										</HStack>
									</HStack>
								</CardHeader>
								<CardBody>
									{filtered.length === 0 ? (
										<Center py={10}><Text color="gray.600">Aucun produit pour l’instant.</Text></Center>
									) : (
										<SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={4}>
											{filtered.map(p => (
												<ProductCard key={p.id} p={p} onEdit={openEdit} onDelete={deleteProduct} />
											))}
										</SimpleGrid>
									)}
								</CardBody>
							</Card>
						</TabPanel>

						{/* Commandes */}
						<TabPanel px={0}>
							<Card>
								<CardHeader>
									<Heading size="md">Commandes</Heading>
								</CardHeader>
								<CardBody>
									{orders.length === 0 ? (
										<Center py={10}><Text color="gray.600">Aucune commande pour le moment.</Text></Center>
									) : (
										<Table size="sm">
											<Thead>
												<Tr>
													<Th>#</Th>
													<Th>Date</Th>
													<Th>Client</Th>
													<Th>Montant</Th>
													<Th>Statut</Th>
												</Tr>
											</Thead>
											<Tbody>
												{orders.map(o => (
													<Tr key={o.id}>
														<Td>{o.id}</Td>
														<Td>{new Date(o.createdAt).toLocaleString('fr-FR')}</Td>
														<Td>{o.customerName}</Td>
														<Td>{o.total.toFixed(2)} €</Td>
														<Td>{o.status}</Td>
													</Tr>
												))}
											</Tbody>
										</Table>
									)}
								</CardBody>
							</Card>
						</TabPanel>

						{/* Catégories */}
						<TabPanel px={0}>
							<Card>
								<CardHeader>
									<HStack justify="space-between"><Heading size="md">Catégories</Heading></HStack>
								</CardHeader>
								<CardBody>
									<VStack align="stretch" spacing={3}>
										{categories.map((c, i) => (
											<HStack key={c} justify="space-between" borderWidth="1px" p={3} borderRadius="md">
												<Text>{c}</Text>
												<HStack>
													<IconButton aria-label="Renommer" size="sm" icon={<FiEdit />} onClick={() => {
														const n = prompt('Nouveau nom de catégorie', c);
														if (!n) return;
														setCategories(prev => prev.map(x => x === c ? n : x));
														setProducts(prev => prev.map(p => p.category === c ? { ...p, category: n } : p));
													}} />
													<IconButton aria-label="Supprimer" size="sm" colorScheme="red" icon={<FiTrash2 />} onClick={() => {
														if (!confirm(`Supprimer la catégorie ${c} ?`)) return;
														setCategories(prev => prev.filter(x => x !== c));
														setProducts(prev => prev.map(p => p.category === c ? { ...p, category: "Autre" } : p));
													}} />
												</HStack>
											</HStack>
										))}
										<HStack>
											<Input placeholder="Nouvelle catégorie" size="sm" id="newCat" />
											<Button size="sm" onClick={() => {
												const el = document.getElementById('newCat');
												const v = (el?.value || '').trim();
												if (!v) return;
												if (categories.includes(v)) return toast({ status:'info', title:'Existe déjà' });
												setCategories(prev => [...prev, v]);
												el.value = '';
											}}>Ajouter</Button>
										</HStack>
									</VStack>
								</CardBody>
							</Card>
						</TabPanel>

						{/* Mise en page */}
						<TabPanel px={0}>
							<VStack align="stretch" spacing={4}>
								<HStack justify="space-between" align="center">
									<Heading size="md">Mise en page — éditeur « puzzle »</Heading>
									<HStack>
										<Button size="sm" leftIcon={<FiEye />} onClick={() => setShowPreview(s => !s)}>{showPreview ? 'Masquer' : 'Afficher'} l’aperçu</Button>
										<Button size="sm" variant="outline" leftIcon={<FiCopy />} onClick={() => {
											navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
											toast({ status:'success', title:'Layout copié' });
										}}>Exporter JSON</Button>
									</HStack>
								</HStack>

								<SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4}>
									{/* Palette */}
									<Card>
										<CardHeader><Heading size="sm">Palette</Heading></CardHeader>
										<CardBody>
											<VStack align="stretch" spacing={2}>
												<Button onClick={() => addBlock('banner')}>Bannière</Button>
												<Button onClick={() => addBlock('promo')}>Produit en promo</Button>
												<Button onClick={() => addBlock('product')}>Produit (sélection)</Button>
												<Button onClick={() => addBlock('grid')}>Grille par catégorie</Button>
												<Button onClick={() => addBlock('text')}>Texte</Button>
												<Button onClick={() => addBlock('spacer')}>Espace</Button>
											</VStack>
										</CardBody>
									</Card>

									{/* Éditeur puzzle */}
									<Card gridColumn={{ base: 'auto', xl: 'span 2' }}>
										<CardHeader><Heading size="sm">Éditeur</Heading></CardHeader>
										<CardBody>
											<Box
												borderWidth="1px"
												borderRadius="md"
												p={3}
											>
												<Grid templateColumns="repeat(12, 1fr)" gap={3} gridAutoFlow="row dense">
													{layout.map((b) => (
														<Box
															key={b.id}
															gridColumn={`span ${Math.min(12, Math.max(3, b.colSpan || 12))}`}
															p={0}
															borderWidth={selectedId === b.id ? '2px' : '1px'}
															borderColor={selectedId === b.id ? 'blue.400' : 'gray.200'}
															borderRadius="md"
															bg={selectedId === b.id ? 'blue.50' : 'white'}
															draggable
															onDragStart={onDragStart(b.id)}
															onDragOver={onDragOver}
															onDrop={onDropOn(b.id)}
															onClick={() => setSelectedId(b.id)}
														>
															<HStack justify="space-between" p={2} bg="gray.50" borderBottomWidth="1px" borderTopRadius="md">
																<HStack>
																	<Tag size="sm"><TagLabel>{b.type}</TagLabel></Tag>
																	<Select size="xs" w="auto" value={b.colSpan}
																		onChange={(e) => changeSpan(b.id, parseInt(e.target.value))}>
																		{[12, 8, 6, 4, 3].map(s => <option key={s} value={s}>{s}/12</option>)}
																	</Select>
																</HStack>
																<HStack>
																	<IconButton aria-label="Monter" size="xs" icon={<FiChevronUp />} onClick={(e) => { e.stopPropagation(); moveBlock(b.id, 'up'); }} />
																	<IconButton aria-label="Descendre" size="xs" icon={<FiChevronDown />} onClick={(e) => { e.stopPropagation(); moveBlock(b.id, 'down'); }} />
																	<IconButton aria-label="Dupliquer" size="xs" icon={<FiCopy />} onClick={(e) => { e.stopPropagation(); duplicateBlock(b.id); }} />
																	<IconButton aria-label="Supprimer" size="xs" colorScheme="red" icon={<FiTrash2 />} onClick={(e) => { e.stopPropagation(); removeBlock(b.id); }} />
																</HStack>
															</HStack>
															<Box p={3}>
																{b.type === 'banner' && (
																	<VStack align="stretch" spacing={2}>
																		<Input size="sm" placeholder="Titre" value={b.data.title || ''} onChange={(e) => updateBlock(b.id, { data: { title: e.target.value } })} />
																		<Input size="sm" placeholder="Sous-titre" value={b.data.subtitle || ''} onChange={(e) => updateBlock(b.id, { data: { subtitle: e.target.value } })} />
																		<Input size="sm" placeholder="Image URL" value={b.data.image || ''} onChange={(e) => updateBlock(b.id, { data: { image: e.target.value } })} />
																		<HStack>
																			<Input size="sm" placeholder="Texte du bouton" value={b.data.ctaText || ''} onChange={(e) => updateBlock(b.id, { data: { ctaText: e.target.value } })} />
																			<Input size="sm" placeholder="Lien" value={b.data.ctaHref || ''} onChange={(e) => updateBlock(b.id, { data: { ctaHref: e.target.value } })} />
																		</HStack>
																	</VStack>
																)}
																{b.type === 'promo' && (
																	<SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
																		<FormControl>
																			<FormLabel fontSize="xs">Produit</FormLabel>
																			<Select size="sm" value={b.data.productId || ''}
																				onChange={(e) => updateBlock(b.id, { data: { productId: e.target.value } })}>
																				{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
																			</Select>
																		</FormControl>
																		<FormControl>
																			<FormLabel fontSize="xs">Label</FormLabel>
																			<Input size="sm" value={b.data.label || ''} onChange={(e) => updateBlock(b.id, { data: { label: e.target.value } })} />
																		</FormControl>
																		<FormControl>
																			<FormLabel fontSize="xs">Réduction (%)</FormLabel>
																			<NumberInput size="sm" min={0} max={90} value={b.data.discount || 0}
																				onChange={(_, v) => updateBlock(b.id, { data: { discount: isNaN(v) ? 0 : v } })}>
																				<NumberInputField />
																			</NumberInput>
																		</FormControl>
																	</SimpleGrid>
																)}
																{b.type === 'product' && (
																	<FormControl>
																		<FormLabel fontSize="xs">Produit</FormLabel>
																		<Select size="sm" value={b.data.productId || ''}
																			onChange={(e) => updateBlock(b.id, { data: { productId: e.target.value } })}>
																			{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
																		</Select>
																	</FormControl>
																)}
																{b.type === 'grid' && (
																	<SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
																		<FormControl>
																			<FormLabel fontSize="xs">Catégorie</FormLabel>
																			<Select size="sm" value={b.data.category || ''}
																				onChange={(e) => updateBlock(b.id, { data: { category: e.target.value } })}>
																				{categories.map(c => <option key={c} value={c}>{c}</option>)}
																			</Select>
																		</FormControl>
																		<FormControl>
																			<FormLabel fontSize="xs">Nombre</FormLabel>
																			<NumberInput size="sm" min={1} max={12} value={b.data.count || 4}
																				onChange={(_, v) => updateBlock(b.id, { data: { count: isNaN(v) ? 4 : v } })}>
																				<NumberInputField />
																			</NumberInput>
																		</FormControl>
																	</SimpleGrid>
																)}
																{b.type === 'text' && (
																	<Textarea size="sm" rows={3} value={b.data.text || ''} onChange={(e) => updateBlock(b.id, { data: { text: e.target.value } })} />
																)}
																{b.type === 'spacer' && (
																	<HStack>
																		<Text fontSize="sm" color="gray.600">Espace (px)</Text>
																		<NumberInput size="sm" min={8} max={96} value={b.data.size || 24}
																			onChange={(_, v) => updateBlock(b.id, { data: { size: isNaN(v) ? 24 : v } })}>
																			<NumberInputField />
																		</NumberInput>
																	</HStack>
																)}
															</Box>
														</Box>
													))}
												</Grid>
											</Box>
										</CardBody>
									</Card>
								</SimpleGrid>

								{showPreview && (
									<Card>
										<CardHeader><Heading size="sm">Aperçu dynamique</Heading></CardHeader>
										<CardBody>
											<Box>
												<Grid templateColumns={{ base: '1fr', md: 'repeat(12, 1fr)' }} gap={4} gridAutoFlow="row dense">
													{layout.map(b => (
														<Box key={b.id} gridColumn={{ base: 'auto', md: `span ${Math.min(12, Math.max(3, b.colSpan || 12))}` }}>
															{b.type === 'banner' && (
																<Flex
																	bgImage={b.data.image || undefined}
																	bgSize="cover"
																	bgPos="center"
																	borderRadius="md"
																	p={10}
																	minH="160px"
																	align="center"
																	justify="space-between"
																	bg={b.data.image ? undefined : 'gray.100'}
																>
																	<VStack align="start" spacing={2}>
																		<Heading size="lg">{b.data.title || 'Titre'}</Heading>
																		<Text color="gray.700">{b.data.subtitle || 'Sous-titre'}</Text>
																		{b.data.ctaText && (
																			<Button colorScheme="blue" size="sm">{b.data.ctaText}</Button>
																		)}
																	</VStack>
																</Flex>
															)}
															{b.type === 'promo' && (() => {
																const p = products.find(x => x.id === b.data.productId);
																if (!p) return <Box borderWidth="1px" p={3} borderRadius="md">Produit introuvable</Box>;
																return (
																	<Card overflow="hidden" borderColor="red.200" borderWidth="1px">
																		<Image src={p.image || '/assets/fallback/_MG_1006.jpg'} alt={p.name} h="160px" w="100%" objectFit="cover" />
																		<CardBody>
																			<HStack justify="space-between" align="start">
																				<VStack align="start" spacing={1}>
																					<Heading size="sm">{p.name}</Heading>
																					<Text fontSize="sm" color="gray.600">{p.category}</Text>
																				</VStack>
																				<Tag colorScheme="red"><TagLabel>{b.data.label || 'Promo'} -{b.data.discount || 0}%</TagLabel></Tag>
																			</HStack>
																			<HStack justify="space-between" pt={2}>
																				<Text fontWeight="bold">{(p.price * (1 - (b.data.discount || 0)/100)).toFixed(2)} € <Text as="span" color="gray.500" textDecor="line-through" ml={2}>{p.price.toFixed(2)} €</Text></Text>
																				<Button size="sm" colorScheme="blue">Voir</Button>
																			</HStack>
																		</CardBody>
																	</Card>
																);
															})()}
															{b.type === 'product' && (() => {
																const p = products.find(x => x.id === b.data.productId);
																if (!p) return <Box borderWidth="1px" p={3} borderRadius="md">Produit introuvable</Box>;
																return <ProductCard p={p} onEdit={() => {}} onDelete={() => {}} />;
															})()}
															{b.type === 'grid' && (() => {
																const arr = products.filter(x => x.active && (b.data.category ? x.category === b.data.category : true)).slice(0, b.data.count || 4);
																return (
																	<SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }} spacing={4}>
																		{arr.map(p => <ProductCard key={p.id} p={p} onEdit={() => {}} onDelete={() => {}} />)}
																	</SimpleGrid>
																);
															})()}
															{b.type === 'text' && (
																<Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
																	<Text>{b.data.text || ''}</Text>
																</Box>
															)}
															{b.type === 'spacer' && (
																<Box h={`${b.data.size || 24}px`} />
															)}
														</Box>
													))}
												</Grid>
											</Box>
										</CardBody>
									</Card>
								)}
							</VStack>
						</TabPanel>

						{/* Paramètres */}
						<TabPanel px={0}>
							<Card>
								<CardHeader><Heading size="md">Paramètres</Heading></CardHeader>
								<CardBody>
									<VStack align="stretch" spacing={4}>
										<HStack justify="space-between">
											<Text>Activer la boutique</Text>
											<Switch defaultChecked isDisabled />
										</HStack>
										<HStack justify="space-between">
											<Text>Mode test (paiements simulés)</Text>
											<Switch isDisabled />
										</HStack>
										<Text color="gray.600">Connecteurs (HelloAsso/Stripe), TVA, frais de port, etc. seront configurables ici.</Text>
									</VStack>
								</CardBody>
							</Card>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</VStack>

			{/* Modal simple de création/édition */}
			{modal.isOpen && (
				<Box position="fixed" inset={0} bg="blackAlpha.600" zIndex={1000} onClick={modal.onClose}>
					<Box as="dialog" onClick={(e) => e.stopPropagation()} style={{ border: 0 }}>
						<Card position="fixed" top="10%" left="50%" transform="translateX(-50%)" w={{ base: '95%', md: '560px' }}>
							<CardHeader>
								<Heading size="md">{edit ? 'Modifier le produit' : 'Nouveau produit'}</Heading>
							</CardHeader>
							<CardBody>
								<VStack align="stretch" spacing={3}>
									<FormControl isRequired>
										<FormLabel>Nom</FormLabel>
										<Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
									</FormControl>
									<FormControl>
										<FormLabel>Identifiant (URL)</FormLabel>
										<Input value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value }))} placeholder="auto depuis le nom" />
									</FormControl>
									<SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
										<FormControl isRequired>
											<FormLabel>Prix (€)</FormLabel>
											<NumberInput min={0} value={form.price} onChange={(_, v) => setForm(p => ({ ...p, price: isNaN(v) ? 0 : v }))}>
												<NumberInputField />
											</NumberInput>
										</FormControl>
										<FormControl>
											<FormLabel>Catégorie</FormLabel>
											<Select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
												{categories.map(c => <option key={c}>{c}</option>)}
											</Select>
										</FormControl>
									</SimpleGrid>
									<FormControl>
										<FormLabel>Image (URL)</FormLabel>
										<Input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://…" />
									</FormControl>
									<FormControl>
										<FormLabel>Description</FormLabel>
										<Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
									</FormControl>
									<HStack justify="space-between">
										<Text>Actif</Text>
										<Switch isChecked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
									</HStack>
									<HStack justify="flex-end" pt={2}>
										<Button variant="ghost" onClick={modal.onClose}>Annuler</Button>
										<Button colorScheme="blue" onClick={saveProduct}>{edit ? 'Enregistrer' : 'Créer'}</Button>
									</HStack>
								</VStack>
							</CardBody>
						</Card>
					</Box>
				</Box>
			)}
		</Box>
	);
}
