import { useState, useEffect } from 'react';
import { Check, BarChart2, Users } from 'lucide-react';
import { getPollResults, voteInPoll } from '@/lib/supabase';
import type { Poll, PollOption } from '@/types';

interface PollMessageProps {
    poll: Poll;
    userId: string;
}

export function PollMessage({ poll, userId }: PollMessageProps) {
    const [pollData, setPollData] = useState<Poll | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadResults();
    }, [poll.id, userId]);

    const loadResults = async () => {
        try {
            const { data } = await getPollResults(poll.id, userId);
            if (data) {
                setPollData(data);
            }
        } catch (error) {
            console.error('Error loading poll results:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async (optionId: string) => {
        try {
            const { error } = await voteInPoll(poll.id, optionId, userId);
            if (!error) {
                await loadResults();
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    if (isLoading || !pollData) {
        return (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="space-y-2">
                    <div className="h-8 bg-gray-100 dark:bg-gray-750 rounded-xl" />
                    <div className="h-8 bg-gray-100 dark:bg-gray-750 rounded-xl" />
                </div>
            </div>
        );
    }

    const options = pollData.options || [];
    const totalVotes = options.reduce((acc, opt) => acc + (opt._count || 0), 0);

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-pink-500" />
                <h4 className="font-bold text-sm">{pollData.question}</h4>
            </div>

            <div className="space-y-3">
                {options.map((option: PollOption) => {
                    const voteCount = option._count || 0;
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    const isVoted = pollData.my_vote === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            className={`w-full group relative flex flex-col gap-1 p-2.5 rounded-xl border transition-all text-left overflow-hidden ${isVoted
                                    ? 'border-pink-500/50 bg-pink-500/5 dark:bg-pink-500/10'
                                    : 'border-gray-100 dark:border-gray-750 hover:border-pink-500/30 hover:bg-gray-50 dark:hover:bg-gray-750/50'
                                }`}
                        >
                            <div className="flex justify-between items-center relative z-10 mb-1">
                                <span className="text-sm font-medium pr-8">{option.text}</span>
                                {isVoted && <Check className="w-4 h-4 text-pink-500 shrink-0" />}
                            </div>

                            <div className="relative h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`absolute left-0 top-0 h-full transition-all duration-500 ${isVoted ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium mt-0.5">
                                <span>{voteCount} suara</span>
                                <span>{Math.round(percentage)}%</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{totalVotes} Total suara</span>
                </div>
                {!pollData.multiple_choice && <span>Pilih satu</span>}
                {pollData.multiple_choice && <span>Pilih banyak</span>}
            </div>
        </div>
    );
}
