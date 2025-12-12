import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { ticketApi } from "../api/ticketApi";
import { Plus, AlertCircle, Wrench, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { formatDate } from "../utils/formatting";

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
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
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
    createMutation.mutate(formData);
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
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-md transition-shadow"
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
                Titel
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
                rows="4"
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
          titel={selectedTicket.title}
          onClose={() => setSelectedTicket(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung
              </label>
              <p className="text-gray-900 dark:text-white">{selectedTicket.description || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) =>
                    updateMutation.mutate({
                      ticketId: selectedTicket.id,
                      data: { status: e.target.value },
                    })
                  }
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
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setSelectedTicket(null)}
                className="flex-1"
              >
                Schließen
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

