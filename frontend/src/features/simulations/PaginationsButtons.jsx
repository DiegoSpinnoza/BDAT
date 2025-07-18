import React from 'react';
import {ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationsButtons({
    numberOfSimulations,
    currentPage,
    totalPages,
    onPrev,
    onNext
}) {
    return (
        <div className="flex justify-end mb-2 gap-2">
        <span className="self-end text-gray-500 text-sm">
            {numberOfSimulations} simulations in total
        </span>
        <div className="flex items-center gap-1 text-gray-700">
            <button
                className="flex items-center gap-2 bg-white rounded-tl-lg rounded-bl-lg shadow-md border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                onClick={onPrev}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="px-2 text-sm font-semibold font-mono min-w-[56px] text-center">
                {currentPage} / {totalPages}
            </span>
            <button
                className="bg-white rounded-tr-lg rounded-br-lg shadow-md border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                onClick={onNext}
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    </div>
    )
}