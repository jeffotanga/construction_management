import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import AppLayout from '../components/AppLayout';

const Tasks = () => {
  const [taskColumns] = useState({
    todo: [
      { title: 'Site inspection report', owner: 'Nina', due: 'May 22', priority: 'High' },
      { title: 'Permit review', owner: 'Luis', due: 'May 24', priority: 'Medium' },
    ],
    inProgress: [
      { title: 'Install scaffolding', owner: 'Jared', due: 'May 20', priority: 'High' },
    ],
    completed: [
      { title: 'Submit foundation plan', owner: 'Alice', due: 'May 16', priority: 'Low' },
    ],
  });

  useEffect(() => {
    // TODO: Load task board from API
  }, []);

  return (
    <AppLayout title="Task Board" subtitle="Kanban view for team workflows and task status">
      <div className="task-board">
        <Row className="g-4">
          <Col lg={4}>
            <Card className="board-column">
              <Card.Body>
                <div className="board-column-header">
                  <div>To Do</div>
                  <Badge bg="secondary">{taskColumns.todo.length}</Badge>
                </div>
                {taskColumns.todo.map((task) => (
                  <Card key={task.title} className="kanban-card mb-3">
                    <Card.Body>
                      <div className="kanban-card-title">{task.title}</div>
                      <div className="kanban-card-meta">{task.owner}</div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <Badge bg={task.priority === 'High' ? 'danger' : 'warning'}>{task.priority}</Badge>
                        <small className="text-muted">Due {task.due}</small>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="board-column">
              <Card.Body>
                <div className="board-column-header">
                  <div>In Progress</div>
                  <Badge bg="info">{taskColumns.inProgress.length}</Badge>
                </div>
                {taskColumns.inProgress.map((task) => (
                  <Card key={task.title} className="kanban-card mb-3">
                    <Card.Body>
                      <div className="kanban-card-title">{task.title}</div>
                      <div className="kanban-card-meta">{task.owner}</div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <Badge bg={task.priority === 'High' ? 'danger' : 'warning'}>{task.priority}</Badge>
                        <small className="text-muted">Due {task.due}</small>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="board-column">
              <Card.Body>
                <div className="board-column-header">
                  <div>Completed</div>
                  <Badge bg="success">{taskColumns.completed.length}</Badge>
                </div>
                {taskColumns.completed.map((task) => (
                  <Card key={task.title} className="kanban-card mb-3">
                    <Card.Body>
                      <div className="kanban-card-title">{task.title}</div>
                      <div className="kanban-card-meta">{task.owner}</div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <Badge bg="secondary">{task.priority}</Badge>
                        <small className="text-muted">Due {task.due}</small>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
};

export default Tasks;
