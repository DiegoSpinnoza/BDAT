import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, ArrowUpRight, Orbit } from 'lucide-react';
import HumanModel from '../components/HumanModel';
import './Home.css';

const REPOSITORY_URL = 'https://github.com/DiegoSpinnoza/BDAT';

const Home = () => {
  const navigate = useNavigate();
  const runSimulation = () => navigate('/simulations', { state: { showTransition: true } });

  return (
    <div className="bdat-landing">
      <div className="landing-atmosphere" aria-hidden="true">
        <div className="atmosphere-glow atmosphere-glow-one" />
        <div className="atmosphere-glow atmosphere-glow-two" />
        <div className="atmosphere-grid" />
        <div className="atmosphere-grain" />
        <span className="background-hex background-hex-one" />
        <span className="background-hex background-hex-two" />
        <span className="background-hex background-hex-three" />
      </div>

      <header className="landing-header">
        <a className="landing-brand" href="#inicio" aria-label="BDAT home">
          <span>bdat</span>
        </a>

        <nav className="landing-nav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#inicio">Home</a>
          <button className="nav-link" type="button" onClick={runSimulation}>Simulations</button>
          <a className="nav-link nav-github" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>

        <button className="header-launch" type="button" onClick={runSimulation}>
          <span>Launch platform</span>
          <ArrowRight aria-hidden="true" />
        </button>
      </header>

      <main id="inicio" className="landing-hero">
        <section className="hero-copy" aria-labelledby="landing-title">
          <div className="hero-eyebrow">
            <span className="eyebrow-orbit"><Orbit aria-hidden="true" /></span>
            <span>Computational biomechanics</span>
          </div>

          <h1 id="landing-title">
            Understand
            <span className="title-accent">the waves</span>
            in bone.
          </h1>

          <p className="hero-description">
            Simulate ultrasonic wave propagation in cortical bone. Configure the model, run computational analyses and explore the results.
          </p>

          <div className="hero-actions">
            <button className="primary-launch" type="button" onClick={runSimulation}>
              Launch platform
              <ArrowRight aria-hidden="true" />
            </button>
            <a className="secondary-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
              Explore BDAT <ArrowUpRight aria-hidden="true" />
            </a>
          </div>

          <div className="hero-facts">
            <div className="hero-fact">
              <span className="fact-mark"><Activity aria-hidden="true" /></span>
              <span><strong>Ultrasonic waves</strong><small>cortical bone</small></span>
            </div>
            <span className="fact-divider" aria-hidden="true" />
            <div className="hero-fact">
              <span className="fact-mark fact-mark-purple"><Orbit aria-hidden="true" /></span>
              <span><strong>Computational</strong><small>simulation results</small></span>
            </div>
          </div>
        </section>

        <section className="hero-visual" aria-label="Scientific visualization of ultrasonic wave propagation">
          <div className="model-halo" aria-hidden="true" />
          <div className="model-orbit model-orbit-outer" aria-hidden="true" />
          <div className="model-orbit model-orbit-inner" aria-hidden="true" />
          <div className="model-vertical-axis" aria-hidden="true" />
          <div className="model-floor-glow" aria-hidden="true" />
          <div className="model-floor-ring model-floor-ring-back" aria-hidden="true" />
          <div className="model-floor-ring model-floor-ring-front" aria-hidden="true" />

          <div className="model-readout model-readout-top" aria-hidden="true">
            <span className="readout-pulse" />
            <span>WAVE ANALYSIS</span>
            <span className="readout-divider" />
            <span>SIMULATION</span>
          </div>
          <div className="model-readout model-readout-bottom" aria-hidden="true">
            <span className="readout-coordinate">01</span>
            <span>ULTRASONIC WAVE PROPAGATION</span>
          </div>

          <div className="model-canvas" aria-hidden="true">
            <HumanModel />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>COMPUTATIONAL BIOMECHANICS</span>
        <span className="footer-center"><i /> Open scientific platform</span>
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">BDAT PROJECT <ArrowUpRight aria-hidden="true" /></a>
      </footer>
    </div>
  );
};

export default Home;
