import React, { useMemo, useState } from "react";
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
import { FiEdit, FiPlus, FiTrash2, FiSettings, FiPackage, FiShoppingCart } from "react-icons/fi";

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
							<Card>
								<CardHeader><Heading size="md">Mise en page (vitrine)</Heading></CardHeader>
								<CardBody>
									<Text color="gray.600">Ici vous pourrez ordonner les catégories, sélectionner les produits mis en avant et configurer les bannières de la page externe RétroMerch. (À brancher sur API)</Text>
								</CardBody>
							</Card>
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
