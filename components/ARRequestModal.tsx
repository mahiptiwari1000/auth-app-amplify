import { useState } from "react";

export default function ARRequestModal() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        arNumber: "",
        requestor: "",
        assignee: "",
        priority: "",
        severity: "",
        description: "",
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Add your submit logic here, e.g., API call
        setIsModalOpen(false); // Close the modal after submission
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
            {/* Trigger Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow-md hover:bg-blue-500"
            >
                New AR Request
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Create New AR Request</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* AR Number */}
                            <input
                                name="arNumber"
                                type="text"
                                placeholder="AR Number"
                                value={formData.arNumber}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                                required
                            />

                            {/* Requestor */}
                            <input
                                name="requestor"
                                type="text"
                                placeholder="Requestor Username"
                                value={formData.requestor}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                                required
                            />

                            {/* Assignee */}
                            <input
                                name="assignee"
                                type="text"
                                placeholder="Assignee Username"
                                value={formData.assignee}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                                required
                            />

                            {/* Priority */}
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Priority</option>
                                <option value="P1">P1</option>
                                <option value="P2">P2</option>
                                <option value="P3">P3</option>
                            </select>

                            {/* Severity */}
                            <select
                                name="severity"
                                value={formData.severity}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Severity</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>

                            {/* Description */}
                            <textarea
                                name="description"
                                placeholder="Description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full p-3 bg-gray-700 text-gray-100 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500"
                                required
                            ></textarea>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
