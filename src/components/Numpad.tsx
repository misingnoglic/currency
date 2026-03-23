import { Delete } from 'lucide-react';

interface NumpadProps {
    onInput: (value: string) => void;
    onClear: () => void;
    onBackspace: () => void;
    onCalculate?: () => void;
}

export function Numpad({ onInput, onClear, onBackspace, onCalculate }: NumpadProps) {
    return (
        <div className="numpad">
            <button className="num-btn" onClick={() => onInput('7')}>7</button>
            <button className="num-btn" onClick={() => onInput('8')}>8</button>
            <button className="num-btn" onClick={() => onInput('9')}>9</button>
            <button className="num-btn action" onClick={() => onInput('/')}>÷</button>

            <button className="num-btn" onClick={() => onInput('4')}>4</button>
            <button className="num-btn" onClick={() => onInput('5')}>5</button>
            <button className="num-btn" onClick={() => onInput('6')}>6</button>
            <button className="num-btn action" onClick={() => onInput('*')}>×</button>

            <button className="num-btn" onClick={() => onInput('1')}>1</button>
            <button className="num-btn" onClick={() => onInput('2')}>2</button>
            <button className="num-btn" onClick={() => onInput('3')}>3</button>
            <button className="num-btn action" onClick={() => onInput('-')}>-</button>

            <button className="num-btn" onClick={() => onInput('.')}>.</button>
            <button className="num-btn" onClick={() => onInput('0')}>0</button>
            <button className="num-btn action" onClick={onBackspace}>
                <Delete size={28} />
            </button>
            <button className="num-btn action" onClick={() => onInput('+')}>+</button>

            <button
                className="num-btn danger"
                onClick={onClear}
                style={{ gridColumn: 'span 2' }}
            >
                C
            </button>
            <button
                className="num-btn action"
                onClick={onCalculate}
                style={{ gridColumn: 'span 2', background: 'var(--accent-color)', color: 'white' }}
            >
                =
            </button>
        </div>
    );
}
