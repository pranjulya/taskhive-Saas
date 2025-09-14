import Header from '@/components/Header';

export default function Home() {
  return (
    <div>
      <Header />
      <main className="container mt-5">
        <div className="row">
          <div className="col-md-8">
            <h1>Welcome to TaskHive</h1>
            <p className="lead">
              The best platform to manage your team's tasks and boost productivity.
            </p>
            <a href="/signup" className="btn btn-primary btn-lg">Get Started</a>
          </div>
        </div>
      </main>
    </div>
  );
}