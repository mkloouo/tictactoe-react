import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

function Square(props) {
    let style;

    if (props.isSelected()) {
        style = {background: 'gray', color: 'white'};
    }

    if (props.isWinner()) {
        style = {backgroundColor: 'black', color: 'white'};
    }

    return (
        <button
            className="square"
            onClick={() => props.onClick()}
            style={style}
        >
            {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {
        return <Square
            key={i}
            value={this.props.squares[i]}
            onClick={() => this.props.onClick(i)}
            isWinner={() => this.props.isWinner(i)}
            isSelected={() => this.props.isSelected(i)}
        />;
    }

    render() {
        const boardRows = [];

        for (let row = 0; row < 3; ++row) {
            const squares = [];
            for (let col = 0; col < 3; ++col) {
                squares.push(this.renderSquare(row * 3 + col));
            }
            boardRows.push(<div key={row} className="board-row">{squares}</div>);
        }

        return (<div>{boardRows}</div>);
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(9).fill(null),
                step: 0
            }],
            xIsNext: true,
            currentStep: 0,
            kbdNavigationHandlers: {
                ArrowLeft: () => {
                    if (this.state.kbdNavigation &&
                        this.state.kbdNavigation.col > 0) {
                        this.setState({
                            kbdNavigation: {
                                col: this.state.kbdNavigation.col - 1,
                                row: this.state.kbdNavigation.row
                            }
                        })
                    }
                },
                ArrowRight: () => {
                    if (this.state.kbdNavigation &&
                        this.state.kbdNavigation.col < 2) {
                        this.setState({
                            kbdNavigation: {
                                col: this.state.kbdNavigation.col + 1,
                                row: this.state.kbdNavigation.row
                            }
                        })
                    }
                },
                ArrowUp: () => {
                    if (this.state.kbdNavigation &&
                        this.state.kbdNavigation.row > 0) {
                        this.setState({
                            kbdNavigation: {
                                col: this.state.kbdNavigation.col,
                                row: this.state.kbdNavigation.row - 1
                            }
                        })
                    }
                },
                ArrowDown: () => {
                    if (this.state.kbdNavigation &&
                        this.state.kbdNavigation.row < 2) {
                        this.setState({
                            kbdNavigation: {
                                col: this.state.kbdNavigation.col,
                                row: this.state.kbdNavigation.row + 1
                            }
                        })
                    }
                },
                Enter: () => {
                    if (this.state.kbdNavigation) {
                        this.handleClick(this.state.kbdNavigation.row * 3 + this.state.kbdNavigation.col);
                    }
                },
            }
        };
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.currentStep + 1);
        const current = history[this.state.currentStep];
        const squares = current.squares.slice();

        if (calculateWinner(squares) || squares[i]) {
            return;
        }

        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares,
                step: this.state.currentStep + 1,
                move: {
                    col: (i % 3) + 1,
                    row: Math.floor(i / 3) + 1
                }
            }]),
            xIsNext: !this.state.xIsNext,
            currentStep: this.state.currentStep + 1
        });
    }

    handleKeyDown(event) {
        if (!this.state.kbdNavigation) {
            this.setState({kbdNavigation: {col: 0, row: 0}});
        } else if (this.state.kbdNavigationHandlers[event.key]) {
            this.state.kbdNavigationHandlers[event.key]();
        }
    }

    jumpTo(step) {
        this.setState({
            currentStep: step,
            xIsNext: (step % 2) === 0
        });
    }

    changeSortType() {
        this.setState({
            sortAsc: !this.state.sortAsc
        });
    }

    getSortedMoves() {
        const sorted = this.state.history.slice().sort((a, b) => {
            if (this.state.sortAsc) {
                return a.step - b.step;
            }
            return b.step - a.step;
        });

        return sorted.map((state) => {
            let desc = state.step ?
                `Go to move #${state.step} (${state.move.col}, ${state.move.row})` :
                'Go to game start';

            if (state.step === this.state.currentStep) {
                desc = <b>{desc}</b>;
            }

            return (
                <li key={state.step}>
                    <button onClick={() => this.jumpTo(state.step)}>{desc}</button>
                </li>
            );
        });
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this), false);
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.currentStep];
        const winner = calculateWinner(current.squares);

        let status;
        if (winner) {
            status = `Winner: ${current.squares[winner[0]]}`;
        } else if (current.squares.every(e => e !== null)) {
            status = 'It\'s a draw';
        } else {
            status = `Next player: ${this.state.xIsNext ? 'X' : 'O'}`;
        }

        const sortButtonText = 'Sort history ' +
            (this.state.sortAsc ? 'ascending' : 'descending');

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        onClick={(i) => this.handleClick(i)}
                        isWinner={(i) => winner && winner.indexOf(i) !== -1}
                        isSelected={(i) => {
                            return this.state.kbdNavigation &&
                                this.state.kbdNavigation.row * 3 + this.state.kbdNavigation.col === i;
                        }}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <button onClick={() => this.changeSortType()}>{sortButtonText}</button>
                    <ol>{this.getSortedMoves()}</ol>
                </div>
            </div>
        );
    }
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 4, 8],
        [2, 4, 6],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8]
    ];

    for (let i = 0; i < lines.length; ++i) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return lines[i];
        }
    }
    return null;
}

// ========================================

ReactDOM.render(
    <Game/>,
    document.getElementById('root')
);
