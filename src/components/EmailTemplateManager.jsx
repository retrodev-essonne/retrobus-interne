/**
 * EmailTemplateManager.jsx
 * Admin component for managing email templates
 * 
 * Features:
 * - List all templates
 * - Create new template
 * - Edit existing template
 * - Delete template
 * - Preview template with test data
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  Badge,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  Spinner,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import {
  EditIcon,
  DeleteIcon,
  AddIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { LucideEye, LucideTrash2, LucidePlus, LucideEdit } from 'lucide-react';

/**
 * API client for email templates
 */
const templateAPI = {
  async getAll(token) {
    const res = await fetch('/api/email-templates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch templates: ${res.statusText}`);
    return res.json();
  },

  async getById(id, token) {
    const res = await fetch(`/api/email-templates/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch template: ${res.statusText}`);
    return res.json();
  },

  async create(data, token) {
    const res = await fetch('/api/email-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create template');
    }
    return res.json();
  },

  async update(id, data, token) {
    const res = await fetch(`/api/email-templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update template');
    }
    return res.json();
  },

  async delete(id, token) {
    const res = await fetch(`/api/email-templates/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete template');
    }
    return res.json();
  },

  async preview(name, data, token) {
    const res = await fetch(`/api/email-templates/preview/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to preview template');
    }
    return res.json();
  }
};

/**
 * Template Editor Modal Component
 */
function TemplateEditorModal({ isOpen, onClose, template, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
    variables: '',
    active: true
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        description: '',
        variables: '',
        active: true
      });
    }
  }, [template, isOpen]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      alert('Name, subject, and body are required');
      return;
    }
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {template?.id ? 'Edit Template' : 'Create New Template'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Template Name (unique, lowercase)</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., ticket_created"
                isDisabled={!!template?.id}
              />
              <FormHelperText>
                Use lowercase letters, numbers, and underscores. Cannot be changed after creation.
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Subject (supports variables)</FormLabel>
              <Input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="New ticket: {{ticket.id}}"
              />
              <FormHelperText>
                Use double curly braces for variables, e.g.: ticket.id, creator.name
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Body (supports variables)</FormLabel>
              <Textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Enter email body..."
                minH="200px"
              />
              <FormHelperText>
                Use double curly braces for variables. Supports plain text.
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe when and how this template is used..."
                minH="80px"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Available Variables (comma-separated, for documentation)</FormLabel>
              <Textarea
                name="variables"
                value={formData.variables}
                onChange={handleChange}
                placeholder="ticket.id, ticket.title, creator.name, creator.email"
                minH="60px"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="active" mb="0">
                Active
              </FormLabel>
              <Switch
                id="active"
                name="active"
                isChecked={formData.active}
                onChange={handleChange}
                ml={4}
              />
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={isLoading}>
            {template?.id ? 'Update' : 'Create'} Template
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Template Preview Modal Component
 */
function TemplatePreviewModal({ isOpen, onClose, template, token }) {
  const [testData, setTestData] = useState('{\n  "ticket": {\n    "id": "T-001",\n    "title": "Test ticket"\n  },\n  "creator": {\n    "name": "John Doe",\n    "email": "john@example.com"\n  }\n}');
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = JSON.parse(testData);
      const result = await templateAPI.preview(template.name, data, token);
      setPreview(result.preview);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Preview Template: {template?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <Box>
              <FormLabel>Test Data (JSON)</FormLabel>
              <Textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                fontFamily="monospace"
                fontSize="xs"
                minH="150px"
              />
            </Box>

            <Button onClick={handlePreview} colorScheme="blue" isLoading={isLoading}>
              Generate Preview
            </Button>

            {error && (
              <Box p={3} bg="red.50" borderRadius="md" color="red.800">
                Error: {error}
              </Box>
            )}

            {preview && (
              <VStack align="start" spacing={3} p={3} bg="gray.50" borderRadius="md">
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">Subject:</Text>
                  <Text fontFamily="monospace" fontSize="sm">{preview.subject}</Text>
                </Box>
                <Divider />
                <Box w="100%">
                  <Text fontWeight="bold" fontSize="sm" color="gray.600">Body:</Text>
                  <Box
                    p={3}
                    bg="white"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    fontFamily="monospace"
                  >
                    {preview.body}
                  </Box>
                </Box>
              </VStack>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Main Component
 */
export default function EmailTemplateManager({ token }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const {
    isOpen: isEditorOpen,
    onOpen: onEditorOpen,
    onClose: onEditorClose
  } = useDisclosure();

  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose
  } = useDisclosure();

  const toast = useToast();

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [token]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await templateAPI.getAll(token);
      setTemplates(result.templates || []);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error loading templates',
        description: err.message,
        status: 'error',
        duration: 3
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedTemplate(null);
    onEditorOpen();
  };

  const handleEditClick = (template) => {
    setSelectedTemplate(template);
    onEditorOpen();
  };

  const handlePreviewClick = (template) => {
    setPreviewTemplate(template);
    onPreviewOpen();
  };

  const handleDeleteClick = async (template) => {
    if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return;
    }

    try {
      await templateAPI.delete(template.id, token);
      toast({
        title: 'Template deleted',
        status: 'success',
        duration: 2
      });
      loadTemplates();
    } catch (err) {
      toast({
        title: 'Error deleting template',
        description: err.message,
        status: 'error',
        duration: 3
      });
    }
  };

  const handleSaveTemplate = async (formData) => {
    try {
      if (selectedTemplate?.id) {
        await templateAPI.update(selectedTemplate.id, formData, token);
        toast({
          title: 'Template updated',
          status: 'success',
          duration: 2
        });
      } else {
        await templateAPI.create(formData, token);
        toast({
          title: 'Template created',
          status: 'success',
          duration: 2
        });
      }
      onEditorClose();
      loadTemplates();
    } catch (err) {
      toast({
        title: 'Error saving template',
        description: err.message,
        status: 'error',
        duration: 3
      });
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Email Templates</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="green"
          onClick={handleCreateClick}
        >
          Create Template
        </Button>
      </Flex>

      {error && (
        <Box p={4} mb={6} bg="red.50" borderRadius="md" color="red.800">
          {error}
        </Box>
      )}

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner size="lg" />
        </Flex>
      ) : templates.length === 0 ? (
        <Card>
          <CardBody textAlign="center" py={12}>
            <Text color="gray.500">No templates yet. Create your first one!</Text>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader pb={2}>
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <Heading size="md">{template.name}</Heading>
                    <Badge colorScheme={template.active ? 'green' : 'gray'}>
                      {template.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </VStack>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody>
                <Stack spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.600" fontWeight="bold">Subject:</Text>
                    <Text fontSize="sm" noOfLines={2}>{template.subject}</Text>
                  </Box>
                  {template.description && (
                    <Box>
                      <Text fontSize="xs" color="gray.600" fontWeight="bold">Description:</Text>
                      <Text fontSize="sm" noOfLines={2}>{template.description}</Text>
                    </Box>
                  )}
                  <HStack spacing={2} pt={2}>
                    <Tooltip label="Preview">
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => handlePreviewClick(template)}
                      >
                        <ViewIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        onClick={() => handleEditClick(template)}
                      >
                        <EditIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => handleDeleteClick(template)}
                      >
                        <DeleteIcon />
                      </Button>
                    </Tooltip>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}

      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={onEditorClose}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
        isLoading={isLoading}
      />

      {previewTemplate && (
        <TemplatePreviewModal
          isOpen={isPreviewOpen}
          onClose={onPreviewClose}
          template={previewTemplate}
          token={token}
        />
      )}
    </Box>
  );
}
