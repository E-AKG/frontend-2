import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { ticketApi } from "../api/ticketApi";
import { Plus, AlertCircle, Wrench, FileText, Clock, CheckCircle, XCircle, Trash2, Edit, MessageSquare, Save, X } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { formatDate, formatDateTime } from "../utils/formatting";

const TICKET_STATUSES = [
  { id: "new", label: "Neu", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { id: "in_progress", label: "In Bearbeitung", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { id: "assigned", label: "Beauftragt", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { id: "resolved", label: "Erledigt", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { id: "closed", label: "Geschlossen", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
];

const PRIORITY_COLORS = {
  low: "text-gray-500",
  medium: "text-amber-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export default function Tickets() {
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    due_date: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    status: "new",
    due_date: "",
  });

  // Lade Tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", selectedClient?.id],
    queryFn: async () => {
      const response = await ticketApi.list({
        client_id: selectedClient?.id,
      });
      return response.data || [];
    },
    enabled: !!selectedClient,
  });

  // Lade Kommentare für ausgewähltes Ticket
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["ticketComments", selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return [];
      const response = await ticketApi.getComments(selectedTicket.id);
      return response.data || [];
    },
    enabled: !!selectedTicket?.id,
  });

  // Mutation: Neues Ticket
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return ticketApi.create(data, {
        client_id: selectedClient?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tickets"]);
      setShowAddModal(false);
      setFormData({
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        due_date: "",
      });
    },
  });

  // Mutation: Ticket aktualisieren
  const updateMutation = useMutation({
    mutationFn: async ({ ticketId, data }) => {
      return ticketApi.update(ticketId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tickets"]);
      setIsEditing(false);
      if (selectedTicket) {
        // Aktualisiere das ausgewählte Ticket
        queryClient.invalidateQueries(["ticketComments", selectedTicket.id]);
      }
    },
  });

  // Mutation: Ticket löschen
  const deleteMutation = useMutation({
    mutationFn: async (ticketId) => {
      return ticketApi.delete(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tickets"]);
      setSelectedTicket(null);
    },
  });

  // Mutation: Kommentar hinzufügen
  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, comment }) => {
      return ticketApi.addComment(ticketId, comment);
    },
    onSuccess: () => {
      refetchComments();
      setNewComment("");
    },
  });

  const handleDragStart = (e, ticket) => {
    e.dataTransfer.setData("ticketId", ticket.id);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    updateMutation.mutate({
      ticketId,
      data: { status: newStatus },
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      due_date: formData.due_date || null,
    };
    createMutation.mutate(data);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const data = {
      ...editFormData,
      due_date: editFormData.due_date || null,
    };
    updateMutation.mutate({
      ticketId: selectedTicket.id,
      data,
    });
  };

  const handleDelete = () => {
    if (!selectedTicket) return;
    if (window.confirm("Möchten Sie dieses Ticket wirklich löschen?")) {
      deleteMutation.mutate(selectedTicket.id);
    }
  };

  const handleAddComment = () => {
    if (!selectedTicket || !newComment.trim()) return;
    addCommentMutation.mutate({
      ticketId: selectedTicket.id,
      comment: newComment.trim(),
    });
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsEditing(false);
    setEditFormData({
      title: ticket.title,
      description: ticket.description || "",
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      due_date: ticket.due_date || "",
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedTicket) {
      setEditFormData({
        title: selectedTicket.title,
        description: selectedTicket.description || "",
        category: selectedTicket.category,
        priority: selectedTicket.priority,
        status: selectedTicket.status,
        due_date: selectedTicket.due_date || "",
      });
    }
  };

  const getTicketsByStatus = (status) => {
    return tickets.filter((t) => t.status === status);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <XCircle className="w-4 h-4" />;
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Bitte wählen Sie einen Mandanten aus.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tickets & Vorgänge</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwaltung von Schäden, Reparaturen und Aufgaben
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Neues Ticket
        </Button>
      </div>

      {/* Kanban-Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {TICKET_STATUSES.map((status) => (
          <div
            key={status.id}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[500px]"
            onDrop={(e) => handleDrop(e, status.id)}
            onDragOver={handleDragOver}
          >
            <div className={`${status.color} px-3 py-2 rounded-lg mb-4 font-semibold text-sm`}>
              {status.label} ({getTicketsByStatus(status.id).length})
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">Lade...</div>
              ) : getTicketsByStatus(status.id).length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm">Keine Tickets</div>
              ) : (
                getTicketsByStatus(status.id).map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onClick={() => handleTicketClick(ticket)}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                        {ticket.title}
                      </h3>
                      <span className={`${PRIORITY_COLORS[ticket.priority]} flex-shrink-0 ml-2`}>
                        {getPriorityIcon(ticket.priority)}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{ticket.category}</span>
                      {ticket.due_date && (
                        <span>{formatDate(ticket.due_date)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Neues Ticket */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          titel="Neues Ticket"
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="z.B. Wasserrohrbruch in Wohnung 2A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                rows="6"
                placeholder="Detaillierte Beschreibung des Problems..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="damage">Schaden</option>
                  <option value="maintenance">Wartung</option>
                  <option value="repair">Reparatur</option>
                  <option value="inquiry">Anfrage</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priorität
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fälligkeitsdatum
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? "Erstelle..." : "Erstellen"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Ticket-Details */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          titel={isEditing ? "Ticket bearbeiten" : selectedTicket.title}
          onClose={() => {
            setSelectedTicket(null);
            setIsEditing(false);
            setNewComment("");
          }}
          groesse="lg"
        >
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  rows="6"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priorität
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="damage">Schaden</option>
                    <option value="maintenance">Wartung</option>
                    <option value="repair">Reparatur</option>
                    <option value="inquiry">Anfrage</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fälligkeitsdatum
                  </label>
                  <input
                    type="date"
                    value={editFormData.due_date}
                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1" disabled={updateMutation.isLoading}>
                  {updateMutation.isLoading ? "Speichere..." : "Speichern"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Ticket-Informationen */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedTicket.title}
                    </h2>
                    {selectedTicket.description && (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                        {selectedTicket.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEditClick}
                      icon={<Edit className="w-4 h-4" />}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDelete}
                      icon={<Trash2 className="w-4 h-4" />}
                      className="text-red-600 hover:text-red-700"
                    >
                      Löschen
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      TICKET_STATUSES.find(s => s.id === selectedTicket.status)?.color || ""
                    }`}>
                      {TICKET_STATUSES.find(s => s.id === selectedTicket.status)?.label || selectedTicket.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Priorität
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Kategorie
                    </label>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {selectedTicket.category}
                    </span>
                  </div>
                  {selectedTicket.due_date && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Fälligkeitsdatum
                      </label>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedTicket.due_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Kommentare-Sektion */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Kommentare ({comments.length})
                </h3>

                {/* Kommentare-Liste */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Noch keine Kommentare</p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {comment.user_id?.substring(0, 2).toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Benutzer {comment.user_id?.substring(0, 8) || "Unbekannt"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(comment.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Neuer Kommentar */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Neuer Kommentar
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-3"
                    rows="3"
                    placeholder="Kommentar hinzufügen..."
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isLoading}
                    icon={<MessageSquare className="w-4 h-4" />}
                  >
                    {addCommentMutation.isLoading ? "Hinzufügen..." : "Kommentar hinzufügen"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
