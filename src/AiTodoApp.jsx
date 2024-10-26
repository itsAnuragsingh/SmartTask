import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash, Trash2, Wand2, Moon, Sun, CheckCircle2 } from "lucide-react" 
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function SmartTask() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (newTodo.trim() !== '') {
      setTodos([...todos, { text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (index) => {
    const newTodos = [...todos];
    newTodos[index].completed = !newTodos[index].completed;
    setTodos(newTodos);
  };

  const deleteTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  const clearAllTodos = () => {
    setTodos([]);
  };

  const generateAiTodos = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Modified prompt to ensure clean output
      const prompt = `Based on this request: "${aiPrompt}", generate a list of tasks. 
      Format: One task per line, no numbers, no dashes, no bullets.
      Example format:
      Buy groceries
      Call dentist
      Send email`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Split by newline and clean up each item
      const todoItems = response
        .split('\n')
        .map(item => item.trim())
        .filter(item => item && !item.startsWith('Format:') && !item.startsWith('Example:'))
        .map(item => item.replace(/^[-•*\d.\s]+/, '').trim()) // Remove any leading symbols or numbers
        .filter(item => item !== ''); // Remove empty items

      // Add each item as a separate todo
      const newTodos = todoItems.map(text => ({ text, completed: false }));
      setTodos(prevTodos => [...prevTodos, ...newTodos]);
      
      setAiPrompt('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error generating todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto rounded-2xl bg-card p-6 shadow-lg border border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="fixed top-4 right-4 rounded-full hover:bg-accent"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center justify-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SmartTask
          </h1>
        </div>
      
        <div className="space-y-6">
          <form onSubmit={addTodo} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task"
                className="flex-grow rounded-xl"
              />
              <Button type="submit" className="rounded-xl">Add Task</Button>
            </div>
          </form>

          {todos.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Your Tasks ({todos.length})</h2>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={clearAllTodos}
                className="rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {todos.map((todo, index) => (
              <Card key={index} className="border border-border rounded-xl hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6">
                      {todo.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Checkbox
                          id={`todo-${index}`}
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(index)}
                          className="rounded-lg"
                        />
                      )}
                    </div>
                    <label
                      htmlFor={`todo-${index}`}
                      className={`${todo.completed ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
                    >
                      {todo.text}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo(index)}
                    aria-label="Delete todo"
                    className="rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Generate with AI
                <Wand2 className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>AI Task Generator</DialogTitle>
                <DialogDescription>
                  Let AI help you create your task list. Just describe what you need!
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={generateAiTodos}>
                <div className="grid gap-4 py-4">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., Plan a weekend trip, or Create a workout routine"
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading} className="rounded-xl">
                    {isLoading ? 'Generating...' : 'Generate Tasks'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}