'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Warehouse,
    FileText,
    MapPin,
    Calendar,
    Settings as SettingsIcon,
    Image as ImageIcon,
    Plus,
    X,
    Loader2,
} from 'lucide-react';
import { createFMAsset } from '@/app/lib/fm-asset-actions';
import { createFMCategory } from '@/app/lib/fm-category-actions';

interface Category {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
}

interface User {
    id: number;
    name: string | null;
    email: string | null;
    userRole: {
        name: string;
    } | null;
    userDepartment: {
        name: string;
    } | null;
}

interface FMAssetFormClientProps {
    categories: Category[];
    suggestedCode: string;
    user: User;
}

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor', 'needs_replacement'];
const STATUS_OPTIONS = ['active', 'in_maintenance', 'retired', 'disposed'];

const STEPS = [
    { id: 1, name: 'Basic Info', icon: Warehouse },
    { id: 2, name: 'Details', icon: FileText },
    { id: 3, name: 'Location', icon: MapPin },
    { id: 4, name: 'Dates & Cost', icon: Calendar },
    { id: 5, name: 'Status', icon: SettingsIcon },
    { id: 6, name: 'Photos', icon: ImageIcon },
];

export default function FMAssetFormClient({
    categories,
    suggestedCode,
    user,
}: FMAssetFormClientProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [localCategories, setLocalCategories] = useState(categories);

    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        name: '',
        assetCode: suggestedCode,
        categoryId: categories[0]?.id || 0,
        type: '',

        // Step 2: Details
        brand: '',
        model: '',
        serialNumber: '',
        description: '',
        specifications: '',

        // Step 3: Location
        building: '',
        floor: '',
        room: '',

        // Step 4: Dates & Cost
        purchaseDate: '',
        installDate: '',
        warrantyExpiry: '',
        purchaseCost: '',
        currentValue: '',

        // Step 5: Status & Maintenance
        condition: 'good',
        status: 'active',
        requiresMaintenance: false,

        // Step 6: Photos
        images: [] as File[],
    });

    const validateStep = (step: number): boolean => {
        setError('');

        switch (step) {
            case 1:
                if (!formData.name.trim()) {
                    setError('Asset name is required');
                    return false;
                }
                if (!formData.assetCode.trim()) {
                    setError('Asset code is required');
                    return false;
                }
                if (!formData.categoryId) {
                    setError('Category is required');
                    return false;
                }
                break;
            case 4:
                // Validate costs are numbers if provided
                if (formData.purchaseCost && isNaN(parseFloat(formData.purchaseCost))) {
                    setError('Purchase cost must be a valid number');
                    return false;
                }
                if (formData.currentValue && isNaN(parseFloat(formData.currentValue))) {
                    setError('Current value must be a valid number');
                    return false;
                }
                break;
            case 6:
                // Validate image count
                if (formData.images.length > 10) {
                    setError('Maximum 10 images allowed');
                    return false;
                }
                // Validate file sizes
                for (const file of formData.images) {
                    if (file.size > 5 * 1024 * 1024) {
                        setError(`File ${file.name} exceeds 5MB limit`);
                        return false;
                    }
                }
                break;
        }

        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setFormData({ ...formData, images: [...formData.images, ...files] });
    };

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = async () => {
        if (!validateStep(6)) return;

        setLoading(true);
        setError('');

        try {
            // Prepare data object
            const submitData = {
                name: formData.name,
                assetCode: formData.assetCode,
                categoryId: formData.categoryId,
                type: formData.type || undefined,
                brand: formData.brand || undefined,
                model: formData.model || undefined,
                serialNumber: formData.serialNumber || undefined,
                description: formData.description || undefined,
                specifications: formData.specifications || undefined,
                building: formData.building || undefined,
                floor: formData.floor || undefined,
                room: formData.room || undefined,
                location: [formData.building, formData.floor, formData.room]
                    .filter(Boolean)
                    .join(', ') || undefined,
                purchaseDate: formData.purchaseDate || undefined,
                installDate: formData.installDate || undefined,
                warrantyExpiry: formData.warrantyExpiry || undefined,
                purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
                currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
                condition: formData.condition,
                status: formData.status,
                requiresMaintenance: formData.requiresMaintenance,
            };

            const asset = await createFMAsset(submitData);

            router.push(`/fm-assets/${asset.assetCode}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCategory(true);

        try {
            await createFMCategory({
                name: newCategoryName,
                description: newCategoryDesc,
            });

            // Add to local list (will refresh to get actual ID)
            const tempCategory = {
                id: Date.now(),
                name: newCategoryName,
                description: newCategoryDesc,
                icon: null,
                color: null,
            };
            setLocalCategories([...localCategories, tempCategory]);
            setFormData({ ...formData, categoryId: tempCategory.id });

            // Reset modal
            setNewCategoryName('');
            setNewCategoryDesc('');
            setShowCategoryModal(false);

            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to create category');
        } finally {
            setCreatingCategory(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create New FM Asset
                    </h1>
                    <p className="text-gray-600">
                        Complete all steps to register a new facility management asset
                    </p>
                </div>

                {/* Progress Stepper */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                                ? 'bg-green-600 border-green-600 text-white'
                                                : isActive
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check size={20} />
                                            ) : (
                                                <Icon size={20} />
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p
                                                className={`text-sm font-medium ${isActive
                                                    ? 'text-primary'
                                                    : isCompleted
                                                        ? 'text-green-600'
                                                        : 'text-gray-500'
                                                    }`}
                                            >
                                                {step.name}
                                            </p>
                                        </div>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Basic Information
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Asset Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Air Conditioning Unit - Building A"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Asset Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.assetCode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, assetCode: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., FM-0001"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Suggested: {suggestedCode}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category *
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                categoryId: parseInt(e.target.value),
                                            })
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        {localCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryModal(true)}
                                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 whitespace-nowrap"
                                        title="Create new category"
                                    >
                                        <Plus size={16} />
                                        New
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <input
                                    type="text"
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Central Air Conditioning"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Asset Details
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Brand
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) =>
                                            setFormData({ ...formData, brand: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Daikin"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Model
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) =>
                                            setFormData({ ...formData, model: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., VRV-X"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Serial Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            serialNumber: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., SN123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Detailed description of the asset..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Specifications
                                </label>
                                <textarea
                                    value={formData.specifications}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            specifications: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Technical specifications (JSON format or plain text)"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Location */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Building
                                </label>
                                <input
                                    type="text"
                                    value={formData.building}
                                    onChange={(e) =>
                                        setFormData({ ...formData, building: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Main Building"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Floor
                                </label>
                                <input
                                    type="text"
                                    value={formData.floor}
                                    onChange={(e) =>
                                        setFormData({ ...formData, floor: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 3rd Floor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Room
                                </label>
                                <input
                                    type="text"
                                    value={formData.room}
                                    onChange={(e) =>
                                        setFormData({ ...formData, room: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Room 301"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Dates & Cost */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Dates & Cost
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                purchaseDate: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Install Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.installDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                installDate: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Warranty Expiry
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.warrantyExpiry}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                warrantyExpiry: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Purchase Cost (THB)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.purchaseCost}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                purchaseCost: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Value (THB)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.currentValue}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                currentValue: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Status & Maintenance */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Status & Maintenance
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Condition
                                </label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) =>
                                        setFormData({ ...formData, condition: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {CONDITION_OPTIONS.map((condition) => (
                                        <option key={condition} value={condition}>
                                            {condition.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {status.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="requiresMaintenance"
                                    checked={formData.requiresMaintenance}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            requiresMaintenance: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label
                                    htmlFor="requiresMaintenance"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Requires Immediate Maintenance
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Photos */}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Photos & QR Code
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Photos
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Max 10 images, 5MB each. Supported: JPG, PNG, WebP
                                </p>
                            </div>

                            {/* Image Previews */}
                            {formData.images.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Selected Images ({formData.images.length})
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {formData.images.map((file, index) => (
                                            <div
                                                key={index}
                                                className="relative group border border-gray-200 rounded-lg p-2"
                                            >
                                                <div className="aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                    <ImageIcon
                                                        size={40}
                                                        className="text-gray-400"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 truncate">
                                                    {file.name}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronLeft size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-sm text-purple-900 font-medium mb-1">
                                    QR Code
                                </p>
                                <p className="text-sm text-purple-700">
                                    A QR code will be automatically generated with code:{' '}
                                    <strong>FM-{formData.assetCode}</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-6 border-t mt-8">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                disabled={loading}
                            >
                                <ChevronLeft size={20} />
                                Back
                            </button>
                        )}

                        <div className="flex-1" />

                        {currentStep < 6 && (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                            >
                                Next
                                <ChevronRight size={20} />
                            </button>
                        )}

                        {currentStep === 6 && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Asset'}
                                <Check size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Add Category Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h3 className="text-lg font-bold text-gray-800">Quick Add Category</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        setNewCategoryName('');
                                        setNewCategoryDesc('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="e.g., HVAC System"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newCategoryDesc}
                                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 resize-none h-20"
                                        placeholder="Optional..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            setNewCategoryName('');
                                            setNewCategoryDesc('');
                                        }}
                                        className="flex-1 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingCategory || !newCategoryName.trim()}
                                        className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {creatingCategory ? (
                                            <><Loader2 className="animate-spin" size={16} /> Creating...</>
                                        ) : (
                                            <><Plus size={16} /> Create</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
