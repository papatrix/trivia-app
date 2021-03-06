import React, { Component } from 'react';
import $ from 'jquery';

import '../stylesheets/QuizView.css';
import { BACKEND_URL } from '../constants';

const questionsPerPlay = 5; 

class QuizView extends Component {
  constructor(props){
    super(props);
    this.state = {
        quizCategory: null,
        previousQuestions: [], 
        showAnswer: false,
        categories: [],
        numCorrect: 0,
        currentQuestion: {},
        guess: '',
        forceEnd: false
    }
  }

  componentDidMount(){
    $.ajax({
      url: `${BACKEND_URL}/categories`,
      type: "GET",
      success: (result) => {
        this.setState({ categories: result.categories })
      },
      error: (error) => {
        alert('Unable to load categories. Please try your request again')
      }
    })
  }

  selectCategory = (id) => {
    this.setState({quizCategory: id}, this.getNextQuestion)
  };

  handleChange = (event) => {
    this.setState({[event.target.name]: event.target.value})
  };

  getNextQuestion = () => {
    const previousQuestions = [...this.state.previousQuestions];
    if(this.state.currentQuestion.id) { previousQuestions.push(this.state.currentQuestion.id) }

    $.ajax({
      url: `${BACKEND_URL}/quizzes`,
      type: "POST",
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({
        previous_questions: previousQuestions,
        quiz_category: String(this.state.quizCategory)
      }),
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      success: (result) => {
        this.setState({
          showAnswer: false,
          previousQuestions: previousQuestions,
          currentQuestion: result.question,
          guess: '',
          forceEnd: result.question ? false : true
        });
      },
      error: () => {
        alert('Unable to load question. Please try your request again')
      }
    })
  };

  submitGuess = (event) => {
    event.preventDefault();
    let evaluate =  this.evaluateAnswer();
    this.setState({
      numCorrect: !evaluate ? this.state.numCorrect : this.state.numCorrect + 1,
      showAnswer: true,
    })
  };

  restartGame = () => {
    this.setState({
      quizCategory: null,
      previousQuestions: [], 
      showAnswer: false,
      numCorrect: 0,
      currentQuestion: {},
      guess: '',
      forceEnd: false
    })
  };

  renderPrePlay() {
      return (
          <div className="quiz-play-holder">
              <div className="choose-header">Choose Category</div>
              <div className="category-holder">
                  {this.state.categories.map(category => {
                  return (
                    <div
                      key={category.id}
                      value={category.id}
                      className="play-category"
                      onClick={() => this.selectCategory(category.id)}>
                      {category.type}
                    </div>
                  )
                })}
              </div>
          </div>
      )
  }

  renderFinalScore(){
    return(
      <div className="quiz-play-holder">
        <div className="final-header"> Your Final Score is {this.state.numCorrect}</div>
        <div className="play-again button" onClick={this.restartGame}> Play Again? </div>
      </div>
    )
  }

  evaluateAnswer = () => {
    const formatGuess = this.state.guess.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
    const answerArray = this.state.currentQuestion.answer.toLowerCase().split(' ');
    return answerArray.includes(formatGuess)
  };

  renderCorrectAnswer(){
    let evaluate =  this.evaluateAnswer();
    return(
      <div className="quiz-play-holder">
        <div className="quiz-question">{this.state.currentQuestion.question}</div>
        <div className={`${evaluate ? 'correct' : 'wrong'}`}>{evaluate ? "You were correct!" : "You were incorrect"}</div>
        <div className="quiz-answer">{this.state.currentQuestion.answer}</div>
        <div className="next-question button" onClick={this.getNextQuestion}> Next Question </div>
      </div>
    )
  }

  renderPlay(){
    return this.state.previousQuestions.length === questionsPerPlay || this.state.forceEnd
      ? this.renderFinalScore()
      : this.state.showAnswer 
        ? this.renderCorrectAnswer()
        : (
          <div className="quiz-play-holder">
            <div className="quiz-question">{this.state.currentQuestion.question}</div>
            <form onSubmit={this.submitGuess}>
              <input type="text" name="guess" onChange={this.handleChange}/>
              <input className="submit-guess button" type="submit" value="Submit Answer" />
            </form>
          </div>
        )
  }


  render() {
    return this.state.quizCategory
        ? this.renderPlay()
        : this.renderPrePlay()
  }
}

export default QuizView;
