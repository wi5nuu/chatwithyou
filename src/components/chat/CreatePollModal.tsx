import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, BarChart2 } from 'lucide-react';

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (question: string, options: string[], allowMultiple: boolean) => void;
}

export function CreatePollModal({ isOpen, onClose, onCreated }: CreatePollModalProps) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);

    const handleAddOption = () => {
        if (options.length < 10) setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = [...options];
            newOptions.splice(index, 1);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = () => {
        const validOptions = options.map(o => o.trim()).filter(o => o !== '');
        if (question.trim() && validOptions.length >= 2) {
            onCreated(question.trim(), validOptions, allowMultiple);
            setQuestion('');
            setOptions(['', '']);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-pink-500" />
                        Buat Polling
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Pertanyaan</p>
                        <Input
                            placeholder="Tanyakan sesuatu..."
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            className="rounded-xl border-gray-200"
                        />
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Pilihan</p>
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder={`Pilihan ${index + 1}`}
                                    value={option}
                                    onChange={e => handleOptionChange(index, e.target.value)}
                                    className="rounded-xl border-gray-200"
                                />
                                {options.length > 2 && (
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} className="shrink-0 text-gray-400">
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {options.length < 10 && (
                            <Button variant="ghost" className="w-full justify-start text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl" onClick={handleAddOption}>
                                <Plus className="w-4 h-4 mr-2" /> Tambah Pilihan
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="allowMultiple"
                            checked={allowMultiple}
                            onChange={e => setAllowMultiple(e.target.checked)}
                            className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500"
                        />
                        <label htmlFor="allowMultiple" className="text-sm text-gray-600">Boleh pilih lebih dari satu</label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="rounded-full">Batal</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full px-8 shadow-lg shadow-pink-500/20"
                    >
                        Buat Polling
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
